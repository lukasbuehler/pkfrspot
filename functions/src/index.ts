import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp(functions.config().firebase);

import algoliasearch from "algoliasearch";
const ALGOLIA_ID = functions.config().algolia.app_id;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key;
const ALGOLIA_SEARCH_KEY = functions.config().algolia.search_key;

const ALGOLIA_INDEX_NAME = "spots";
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

/**
 * This function counts all the likes on one post and updates the number of likes on the post document. It is run everytime a like is added, updated or removed.
 */
export const countPostLikesOnWrite = functions.firestore
  .document("posts/{postId}/likes/{likeId}")
  .onWrite((change, context) => {
    //const likeId = context.params.likeId;
    const likedPostId = context.params.postId;

    const postRef = admin.firestore().collection("posts").doc(likedPostId);

    return postRef
      .collection("likes")
      .get()
      .then((snapshot) => {
        const likeCount = snapshot.size;

        return postRef.update({ like_count: likeCount });
      });
  });

// Update the search index every time a blog post is written.
export const createTextSearchIndexOnSpotWrite = functions.firestore
  .document("spots/{spotId}")
  .onWrite((snap, context) => {
    // Get the note document
    const spot = snap.after.data() || {};

    // Add an 'objectID' field which Algolia requires
    spot.objectID = context.params.spotId;

    // Write to the algolia index
    const index = client.initIndex(ALGOLIA_INDEX_NAME);

    return index.saveObject(spot);
  });

/**
 * This function clusters spots and puts them in a document for overviewing the spot map.
 * It runs every hour at 0 minutes.
 */
/*
//export const clusterSpots = functions.pubsub.schedule("'0 * * * *'").onRun((context) => {
export const clusterSpots = functions.https.onCall((data, context) => {
  // TODO implement rating opacity or something like that
  // 1) Get all the spots that changed location since last run
  // 2) Start on the first spot and cluster it and all the spots with it on the same tile z16
  //3) remove all the spots from the list that changed that are on this tile (not necessairy at the moment)

  const promise = new Promise<string>((resolve, reject) => {
    // 1) getting all the spots that changed
    //const currentDate = new Date();
    const loadedTiles: string[] = [];
    const spots: any[] = [];
    admin
      .firestore()
      .collection("spots")
      // TODO Enable partial clustering instead of all spots
      //.where("last_updated", ">=", currentDate.setHours(currentDate.getHours() - 1))
      .get()
      .then((spotsSnapshot) => {
        let spotDocNbr = 1;
        console.log(`Found ${spotsSnapshot.size} spots to cluster`);
        spotsSnapshot.forEach((spotDoc) => {
          // we now need to laod all the spots on this tile and mark the tile as loaded
          const tile = spotDoc.data().tile_coordinates.z16;
          if (!loadedTiles.includes(`${tile.x}_${tile.y}`)) {
            // the tile wasn't loaded
            loadedTiles.push(`${tile.x}_${tile.y}`);

            // load all the spots from the tile and push them to the spots array
            admin
              .firestore()
              .collection("spots")
              .where("tile_coordinates.z16.x", "==", tile.x)
              .where("tile_coordinates.z16.y", "==", tile.y)
              .get()
              .then((tileSnapshot) => {
                tileSnapshot.forEach((tileDoc) => {
                  spots.push(tileDoc.data());
                });

                // 2) cluster all the spots
                const startZoom = 2;
                const zoomTilesLength = 1 << startZoom;
                for (let y = 0; y < zoomTilesLength; y++) {
                  for (let x = 0; x < zoomTilesLength; x++) {
                    clusterRecursion({ x: x, y: y }, startZoom, spots);
                  }
                }

                if (spotDocNbr === spotsSnapshot.size) {
                  // this is the last spot.
                  resolve("Done: Clustered " + spotDocNbr + " spots.");
                  return;
                }
                spotDocNbr++;
              })
              .catch((error) => {
                console.error(`Error fetching all the spots for the tile ${tile.x},${tile.y}`);
                reject("ERRRROROROROORRORO");
              });
          }
        });
      })
      .catch((error) => {
        console.error("Error loading the spots that changed since last run", error);
      });
  });
  return promise
    .then((text: string) => {
      return { msg: "The function successfully finished", text: text };
    })
    .catch((error) => {
      return { text: "There was an error during the execution", error: error };
    });
});

const clusterRecursion = function (
  tile: { x: number; y: number },
  zoom: number,
  spots: any[]
): { location: { latitude: number; longitude: number }; value: number }[] {
  console.log(`Entered recurision. tile ${tile.x},${tile.y}, zoom: ${zoom}, spots: ${spots.length}`);
  // base case
  if (zoom <= 16) {
    // make points for all the spots in the tile
    // and return those
    const points = [];
    for (const spot of spots) {
      points.push({ location: spot.location, value: 1 });
    }
    return points;
  }

  const nextZoom = zoom + 1;
  const nextTiles = {
    tl: { x: tile.x * 2, y: tile.y * 2 },
    tr: { x: tile.x * 2 + 1, y: tile.y * 2 },
    bl: { x: tile.x * 2, y: tile.y * 2 + 1 },
    br: { x: tile.x * 2 + 1, y: tile.y * 2 + 1 },
  };

  const filteredSpots = filterSpots(spots, tile, nextTiles, zoom);

  const tlPoints = clusterRecursion(nextTiles.tl, nextZoom, filteredSpots.tl);
  const trPoints = clusterRecursion(nextTiles.tr, nextZoom, filteredSpots.tr);
  const blPoints = clusterRecursion(nextTiles.bl, nextZoom, filteredSpots.bl);
  const brPoints = clusterRecursion(nextTiles.br, nextZoom, filteredSpots.br);

  if (zoom % 2 === 0) {
    // this is an even zoom and we want to cluster, save and return the clusted points
    clusterPoints(tlPoints);
    const allClusteredPoints = clusterPoints(tlPoints).concat(
      clusterPoints(trPoints),
      clusterPoints(blPoints),
      clusterPoints(brPoints)
    );

    // save the clustered points to the db
    console.info(
      "Is saving spot_clusters/by_zoom/" +
        tile.x +
        "_" +
        tile.y +
        " with data: " +
        JSON.stringify({ points: allClusteredPoints, time_updated: new Date() })
    );
    
    admin
      .firestore()
      .collection("spot_clusters")
      .doc("by_zoom")
      .collection("z" + zoom)
      .doc(tile.x + "_" + tile.y)
      .set({ points: allClusteredPoints, time_updated: new Date() })
      .then(() => {
        // saving successful
        // Not necessairy to remove something from a db or stuff like that
        console.log("Updated spot cluster on tile: " + tile.x + "," + tile.y);
      })
      .catch((error) => {
        // error saving
        console.error("Error saving the cluster points on tile: " + tile.x + "," + tile.y, error);
      });

    return allClusteredPoints;
  } else {
    // this is an uneven zoom and we want to simply return all the points
    const allPoints = tlPoints.concat(trPoints, blPoints, brPoints);
    return allPoints;
  }
};

const filterSpots = function (spots: any[], tile: { x: number; y: number }, nextTiles: any, zoom: number) {
  const tlSpots = [];
  const trSpots = [];
  const blSpots = [];
  const brSpots = [];
  for (const spot of spots) {
    const spotTileCoords = spot.tile_coordinates["z" + zoom];
    if (spotTileCoords === nextTiles.tl) {
      tlSpots.push(spot);
    } else if (spotTileCoords === nextTiles.tr) {
      trSpots.push(spot);
    } else if (spotTileCoords === nextTiles.bl) {
      blSpots.push(spot);
    } else if (spotTileCoords === nextTiles.br) {
      brSpots.push(spot);
    }
  }

  return {
    tl: tlSpots,
    tr: trSpots,
    bl: blSpots,
    br: brSpots,
  };
};

const clusterPoints = function (
  points: { location: { latitude: number; longitude: number }; value: number }[]
): { location: { latitude: number; longitude: number }; value: number }[] {
  // calculte lat average
  let xAvg = 0;
  let yAvg = 0;
  let valSum = 0;

  for (const point of points) {
    xAvg += point.location.latitude * point.value;
    yAvg += point.location.longitude * point.value;
    valSum += point.value;
  }

  const newValue = valSum / 4;
  if (newValue < 0.25) {
    // the point is too small, just get rid of it.
    return [];
  }

  const returnPoint = { location: { latitude: xAvg / valSum, longitude: yAvg / valSum }, value: 1 };

  return [returnPoint];
};
*/
