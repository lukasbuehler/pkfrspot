import * as admin from "firebase-admin";
import {
  onDocumentWritten,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

import { setGlobalOptions } from "firebase-functions/v2/options";
setGlobalOptions({ maxInstances: 10 });

import { GeoPoint } from "firebase-admin/firestore";

admin.initializeApp();

// get the google API Key from the secret manager
const googleAPIKey = defineSecret("GOOGLE_API_KEY");

/**
 * This function counts all the likes on one post and updates the number of likes on the post document.
 * It is run everytime a like is added, updated or removed.
 */
export const countPostLikesOnWrite = onDocumentWritten(
  "posts/{postId}/likes/{likeId}",
  async (event) => {
    //const likeId = context.params.likeId;
    const likedPostId = event.params.postId;

    const postRef = admin.firestore().collection("posts").doc(likedPostId);

    return postRef
      .collection("likes")
      .get()
      .then((snapshot) => {
        const likeCount = snapshot.size;

        return postRef.update({ like_count: likeCount });
      });
  }
);

/**
 * This function counts all the comments on one post and updates the number of comments on the post document.
 */
export const countFollowersOnWrite = onDocumentWritten(
  "users/{userId}/followers/{followerId}",
  async (event) => {
    const userId = event.params.userId;

    const userRef = admin.firestore().collection("users").doc(userId);

    return userRef
      .collection("followers")
      .get()
      .then((snapshot) => {
        const followerCount = snapshot.size;

        return userRef.update({ follower_count: followerCount });
      });
  }
);

/**
 * This function counts all the following on one user and updates the number of following on the user document.
 */
export const countFollowingOnWrite = onDocumentWritten(
  "users/{userId}/following/{followingId}",
  async (event) => {
    const userId = event.params.userId;

    const userRef = admin.firestore().collection("users").doc(userId);

    return userRef
      .collection("following")
      .get()
      .then((snapshot) => {
        const followingCount = snapshot.size;

        return userRef.update({ following_count: followingCount });
      });
  }
);

interface PartialSpotSchema {
  // address?: {
  //     country: {
  //         code: string;
  //         name: string;
  //     };
  //     formatted: string;
  //     locality: string;
  //     sublocality?: string;
  // }
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
  isIconic?: boolean;
  rating?: number;
}

interface ClusterTileDot {
  location: GeoPoint;
  weight: number;
}

interface SpotClusterTile {
  // the zoom level the tile should be loaded and displayed at.
  zoom: number;
  x: number;
  y: number;

  // the array of cluster points with their corresponding weights.
  dots: ClusterTileDot[];

  spots: {
    // name: string;
    // locality: string;
    rating: number; // whole number 1-10
    isIconic: boolean;
  }[];
}

/*
 * Cluster all spots
 */
export const clusterAllSpots = onDocumentCreated(
  "spot_clusters/run",
  async (event) => {
    // define clustering function
    const getClusterTilesForAllSpots = (
      allSpots: PartialSpotSchema[]
    ): Map<string, SpotClusterTile> => {
      //   const zoomJump: number = 4;
      //   const highestDotZoom: number = 12;

      const clusterTiles = new Map<string, SpotClusterTile>();

      const clusterTilesMap = {
        12: new Map<string, string[]>(),
        8: new Map<string, string[]>(),
        4: new Map<string, string[]>(),
      };

      // fistt add a dot for every spot at
      allSpots.forEach((spot) => {
        // for each spot, add a point of weight 1 to a cluster tile of zoom 14

        // get the tile coordinates for the spot at zoom 14
        const tile = spot.tile_coordinates.z12; // the coords are for tiles at zoom 12

        const clusterTileDot: ClusterTileDot = {
          location: spot.location,
          weight: 1,
        };

        // check if the tile exists in the clusterTilesMap for zoom 12
        if (clusterTiles.has(`z12_${tile.x}_${tile.y}`)) {
          // if the tile exists, add the spot to the array of spots in the cluster tile
          clusterTiles
            .get(`z12_${tile.x}_${tile.y}`)!
            .dots.push(clusterTileDot);

          // if(spot.isIconic || spot.rating) {
          // clusterTiles
          // .get(`z14_${tile.x}_${tile.y}`)!
          // .spots.push({
          //     rating: spot.rating,
          //     isIconic: spot.isIconic ?? false
          // });
          // }
        } else {
          // if the tile does not exist, create a new array with the spot and add it to the clusterTilesMap for zoom 12
          clusterTiles.set(`z12_${tile.x}_${tile.y}`, {
            zoom: 12,
            x: tile.x,
            y: tile.y,
            dots: [clusterTileDot],
            spots: [],
          });

          // also add the 12 tile to the cluster tiles map for zoom 8
          const key8 = `z8_${tile.x >> 4}_${tile.y >> 4}`;
          if (!clusterTilesMap[8].has(key8)) {
            clusterTilesMap[8].set(key8, [`z12_${tile.x}_${tile.y}`]);
          } else {
            clusterTilesMap[8].get(key8)!.push(`z12_${tile.x}_${tile.y}`);
          }
        }
      });

      for (let zoom = 8; zoom >= 4; zoom -= 4) {
        // for each z cluster tile to compute in the map
        for (let [tileKey, smallerTileKeys] of clusterTilesMap[
          zoom as 8 | 4
        ].entries()) {
          const firstSmallerTile = clusterTiles.get(smallerTileKeys[0])!;

          const clusterDots: ClusterTileDot[] = smallerTileKeys
            .map((key) => {
              return (clusterTiles.get(key) as SpotClusterTile).dots;
            })
            .map((dots) => {
              const totalWeight = dots.reduce(
                (acc, dot) => acc + dot.weight,
                0
              );
              return dots.reduce(
                (acc, dot) => {
                  let newLatitude =
                    acc.location.latitude +
                    (dot.weight * dot.location.latitude) / totalWeight;
                  let newLongitude =
                    acc.location.longitude +
                    (dot.weight * dot.location.longitude) / totalWeight;

                  // Wrap around latitude [-90, 90], longitude around [-180, 180]
                  newLatitude = ((((newLatitude + 90) % 180) + 180) % 180) - 90;
                  newLongitude =
                    ((((newLongitude + 180) % 360) + 360) % 360) - 180;

                  const newGeopoint = new GeoPoint(newLatitude, newLongitude);
                  acc.location = newGeopoint;
                  acc.weight += dot.weight;
                  return acc;
                },
                { location: new GeoPoint(0, 0), weight: 0 }
              );
            });

          clusterTiles.set(tileKey, {
            zoom: zoom,
            x: firstSmallerTile.x >> 4,
            y: firstSmallerTile.y >> 4,
            dots: clusterDots,
            spots: [],
          });

          // also add the zoom tile to the cluster tiles map for the next zoom level
          if (zoom > 4) {
            const tile = clusterTiles.get(tileKey)!;
            const key = `z${zoom - 4}_${tile.x >> 4}_${tile.y >> 4}`;
            if (!clusterTilesMap[(zoom - 4) as 8 | 4].has(key)) {
              clusterTilesMap[(zoom - 4) as 8 | 4].set(key, [tileKey]);
            } else {
              clusterTilesMap[(zoom - 4) as 8 | 4].get(key)!.push(tileKey);
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

        // get all clusters
        const clusters: Map<string, SpotClusterTile> =
          getClusterTilesForAllSpots(spots);

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

                    // the run document does not need to be deleted here,
                    // it was deleted together with the old clusters if everything went well.
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
  }
);

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

type AddressType = {
  sublocality?: string;
  locality?: string;
  country?: {
    code: string; // alpha 2
    name: string;
  };
  formatted?: string;
};

type ResultType = {
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  formatted_address: string;
  geometry: any;
  place_id: string;
};

const updateSpotAddressFromLocation = async (
  location: GeoPoint,
  apiKey: string
): Promise<AddressType> => {
  if (!location || !location.latitude || !location.longitude) {
    return Promise.reject("Location is invalid");
  }
  if (!apiKey) {
    return Promise.reject("Google API Key is missing");
  }

  const lat = location.latitude;
  const lng = location.longitude;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&` +
      `result_type=street_address|country|locality|sublocality`
  ).catch((err) => {
    console.error("Error in reverse geocoding request", err);
    return Promise.reject(err);
  });
  const data = await response.json().catch((err) => {
    console.error("Error parsing reverse geocoding response", err);
    return Promise.reject(err);
  });

  const address: AddressType = {};

  // loop over the results
  for (const result of data.results as ResultType[]) {
    // set the formatted address if not set yet
    if (!address.formatted) {
      address.formatted = result.formatted_address;
    }

    for (const component of result.address_components) {
      // set the country if not set yet
      if (!address.country && component.types.includes("country")) {
        address.country = {
          code: component.short_name,
          name: component.long_name,
        };
      }
      // set the locality if not set yet
      else if (!address.locality && component.types.includes("locality")) {
        address.locality = component.short_name;
      }
      // set the sublocality if not set yet
      else if (
        !address.sublocality &&
        component.types.includes("sublocality")
      ) {
        address.sublocality = component.short_name;
      } else if (
        !!address.country &&
        !!address.locality &&
        !!address.sublocality
      ) {
        break;
      } else {
        continue;
      }
    }
    if (
      !!address.formatted &&
      !!address.country &&
      !!address.locality &&
      !!address.sublocality
    ) {
      console.debug(
        "Found formatted address and all address components, sublocality, locality, country. Exiting early."
      );
      break;
    }
  }

  return address;
};

/**
 * Update the address of a spot when the location changes.
 * This function is triggered when a spot is written (created, updated or deleted).
 */
// export const updateSpotAddressOnWrite = functions.firestore.onDocumentWritten(
//   "spots/{spotId}",
//   async (event) => {
//     // if the location of the spot has changed, call Googles reverse geocoding to get the address.
//     if (
//       !(event.data?.before?.data()?.location as GeoPoint).isEqual(
//         event.data?.after?.data()?.location
//       )
//     ) {
//       const location = event.data?.after?.data()?.location as GeoPoint;

//       const address = await updateSpotAddressFromLocation(location);

//       return event.data?.after?.ref.update({ address: address });
//     }
//     return;
//   }
// );

/**
 * Update the addresses of all existing spots.
 */
export const updateAllSpotAddresses = onDocumentCreated(
  { document: "spots/run-update-addresses", secrets: [googleAPIKey] },
  async (event) => {
    const spots = await admin.firestore().collection("spots").get();
    const apiKey: string = googleAPIKey.value();

    for (const spot of spots.docs) {
      const location = spot.data().location as GeoPoint;
      if (!location) {
        console.warn("Spot has no location", spot.id);
        continue;
      }
      if (!location?.latitude || !location?.longitude) {
        console.warn("Spot location is invalid", spot.id, location);
        continue;
      }

      const address = await updateSpotAddressFromLocation(
        location,
        apiKey
      ).catch((err) => {
        console.error("Error updating address for spot", spot.id, err);
        return Promise.reject(err);
      });

      await spot.ref.update({ address: address });
      console.log("Updated address for spot", spot.id, address);
    }

    // delete the run document
    return event.data?.ref.delete();
  }
);
