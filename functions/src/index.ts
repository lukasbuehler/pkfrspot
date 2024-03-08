import * as functions from "firebase-functions/v1"; // TODO update to v2
import * as admin from "firebase-admin";
import { GeoPoint } from "firebase-admin/firestore";

admin.initializeApp(functions.config().firebase);

/**
 * This function counts all the likes on one post and updates the number of likes on the post document.
 * It is run everytime a like is added, updated or removed.
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

/**
 * This function counts all the comments on one post and updates the number of comments on the post document.
 */
export const countFollowersOnWrite = functions.firestore
  .document("users/{userId}/followers/{followerId}")
  .onWrite((change, context) => {
    const userId = context.params.userId;

    const userRef = admin.firestore().collection("users").doc(userId);

    return userRef
      .collection("followers")
      .get()
      .then((snapshot) => {
        const followerCount = snapshot.size;

        return userRef.update({ follower_count: followerCount });
      });
  });

/**
 * This function counts all the following on one user and updates the number of following on the user document.
 */
export const countFollowingOnWrite = functions.firestore
  .document("users/{userId}/following/{followingId}")
  .onWrite((change, context) => {
    const userId = context.params.userId;

    const userRef = admin.firestore().collection("users").doc(userId);

    return userRef
      .collection("following")
      .get()
      .then((snapshot) => {
        const followingCount = snapshot.size;

        return userRef.update({ following_count: followingCount });
      });
  });

interface PartialSpotSchema {
  location: GeoPoint;
  tile_coordinates: {
    z2: { x: number; y: number };
    z4: { x: number; y: number };
    z6: { x: number; y: number };
    z8: { x: number; y: number };
    z10: { x: number; y: number };
    z12: { x: number; y: number };
    z14: { x: number; y: number };
    z16: { x: number; y: number };
  };
}

interface SpotClusterTile {
  // the zoom level the tile should be loaded and displayed at.
  zoom: number;
  x: number;
  y: number;

  // the array of cluster points with their corresponding weights.
  points: {
    location: GeoPoint;
    weight: number;
  }[];
}

/*
 * Cluster all spots
 */
export const clusterAllSpots = functions.firestore
  .document("spot_clusters/run")
  .onCreate((snap, context) => {
    // define clustering function
    const getClusterTilesForAllSpots = (
      allSpots: PartialSpotSchema[]
    ): Map<string, SpotClusterTile> => {
      const clusterTiles = new Map<string, SpotClusterTile>();

      const clusterTilesMap = {
        12: new Map<string, string[]>(),
        10: new Map<string, string[]>(),
        8: new Map<string, string[]>(),
        6: new Map<string, string[]>(),
        4: new Map<string, string[]>(),
        2: new Map<string, string[]>(),
      };

      allSpots.forEach((spot) => {
        // for each spot, add a point of weight 1 to a cluster tile of zoom 14

        // get the tile coordinates for the spot at zoom 14
        const tile = spot.tile_coordinates.z12; // the coords are for tiles at zoom 12

        const clusterTilePoint = {
          location: spot.location,
          weight: 1,
        };

        // check if the tile exists in the clusterTilesMap for zoom 14
        if (clusterTiles.has(`z14_${tile.x}_${tile.y}`)) {
          // if the tile exists, add the spot to the array of spots in the cluster tile
          clusterTiles
            .get(`z14_${tile.x}_${tile.y}`)!
            .points.push(clusterTilePoint);
        } else {
          // if the tile does not exist, create a new array with the spot and add it to the clusterTilesMap for zoom 14
          clusterTiles.set(`z14_${tile.x}_${tile.y}`, {
            zoom: 14,
            x: tile.x,
            y: tile.y,
            points: [clusterTilePoint],
          });

          // also add the 14 tile to the cluster tiles map for zoom 12
          const key12 = `z12_${tile.x >> 2}_${tile.y >> 2}`;
          if (!clusterTilesMap[12].has(key12)) {
            clusterTilesMap[12].set(key12, [`z14_${tile.x}_${tile.y}`]);
          } else {
            clusterTilesMap[12].get(key12)!.push(`z14_${tile.x}_${tile.y}`);
          }
        }
      });

      for (let zoom = 12; zoom >= 2; zoom -= 2) {
        // for each z cluster tile to compute in the map
        for (let [tileKey, smallerTileKeys] of clusterTilesMap[
          zoom as 12 | 10 | 8 | 6 | 4 | 2
        ].entries()) {
          const firstSmallerTile = clusterTiles.get(smallerTileKeys[0])!;

          clusterTiles.set(tileKey, {
            zoom: zoom,
            x: firstSmallerTile.x >> 2,
            y: firstSmallerTile.y >> 2,
            points: smallerTileKeys
              .map((key) => {
                return (clusterTiles.get(key) as SpotClusterTile).points;
              })
              .flat(), // TODO actually cluster
          });

          // also add the zoom tile to the cluster tiles map for the next zoom level
          if (zoom > 2) {
            const tile = clusterTiles.get(tileKey)!;
            const key = `z${zoom - 2}_${tile.x >> 2}_${tile.y >> 2}`;
            if (
              !clusterTilesMap[(zoom - 2) as 12 | 10 | 8 | 6 | 4 | 2].has(key)
            ) {
              clusterTilesMap[(zoom - 2) as 12 | 10 | 8 | 6 | 4 | 2].set(key, [
                tileKey,
              ]);
            } else {
              clusterTilesMap[(zoom - 2) as 12 | 10 | 8 | 6 | 4 | 2]
                .get(key)!
                .push(tileKey);
            }
          }
        }
      }

      return clusterTiles;
    };

    // 1. load ALL spots
    return admin
      .firestore()
      .collection("spots")
      .get()
      .then((spotsSnap) => {
        const spots: PartialSpotSchema[] = spotsSnap.docs.map((doc) => {
          return doc.data() as PartialSpotSchema;
        });

        const clusters = getClusterTilesForAllSpots(spots);

        // delete all existing clusters with a batch write
        const deleteBatch = admin.firestore().batch();
        return admin
          .firestore()
          .collection("spot_clusters")
          .get()
          .then((clustersSnap) => {
            clustersSnap.forEach((doc) => {
              deleteBatch.delete(doc.ref);
            });
            return deleteBatch
              .commit()
              .then(() => {
                console.log("deleted all old clusters");

                // add newly created clusters with a batch write
                if (clusters.size === 0) return;

                console.log("adding " + clusters.size + " new clusters");

                const addBatch = admin.firestore().batch();
                clusters.forEach((cluster, key) => {
                  const newClusterRef = admin
                    .firestore()
                    .collection("spot_clusters")
                    .doc(key);
                  addBatch.set(newClusterRef, cluster);
                });

                return addBatch
                  .commit()
                  .then(() => {
                    console.log("done :)");
                  })
                  .catch((err) => {
                    console.error("Error adding new clusters: ", err);
                  });
              })
              .catch((err) => {
                console.error("Error deleting clusters: ", err);
              });
          });
      });
  });

// export const clusterSpotsOnWrite = functions.firestore
//   .document("spots/{spotId}")
//   .onWrite(async (change, context) => {
//     const spotData: Spot.Schema = change.after.data() as Spot.Schema;

//     const tileCoordinates = spotData.tile_coordinates;

//     for (let zoom = 12; zoom >= 2; zoom += 2) {
//       const tile =
//         tileCoordinates[`z${zoom}` as keyof Spot.Schema["tile_coordinates"]];

//       const updatedSpotClusterTile: SpotClusterTile = {
//         zoom: zoom,
//         x: tile.x,
//         y: tile.y,
//         points: [],
//       };

//       await admin
//         .firestore()
//         .collection("spot_clusters")
//         .doc(`z${zoom}_${tile.x}_${tile.y}`)
//         .set(updatedSpotClusterTile, { merge: false });
//     }
//   });
