import * as functions from "firebase-functions/v1"; // TODO update to v2
import * as admin from "firebase-admin";
import { MapHelper } from "../../pkfrspot-web/src/scripts/map_helper";
import { SpotClusterTile } from "../../pkfrspot-web/src/scripts/db/SpotClusterTile";
import { Spot } from "../../pkfrspot-web/src/scripts/db/Spot";

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

export const clusterAllSpots = functions.pubsub
  .schedule("30 15 26 2 *")
  .onRun(async (context) => {
    // 1. load all spots
    // for each spot, add a point to the corresponding cluster tile for zoom 14

    // 2. for the zoom levels z = 14, 12, 10, 8, 6:
    // for each quartet of corresponding clusters, cluster the points into a single weighted point
    // and add them to the correspond cluster tile for zoom z-2 (12, 10, 8, 6, 4)
    /*
        Example: 16 tiles (A, B, ...) at a given zoom (e.g zoom 14) making up 4 tiles at one lower zoom (e.g zoom 13)
        Now for each quartet of tiles at zoom 14, which make up one tile at zoom 13, we cluster the points into a single weighted point.
        Resulting in a maximum number of 4 weighted points for each tile at zoom 12.

        --------------------
        || A | B || C | D ||
        ||----------------||
        || E | F || G | H ||
        ||================||
        || I | J || K | L ||
        ||----------------||
        || M | N || O | P ||
        --------------------
    */

    /////////////////////////////////////////////////////////////////

    /**
     * A map that stores cluster tiles for each zoom level with which existing
     * child cluster tiles exist in which quadrant.
     */
    const higherTilesMap = {
      12: new Map<string, { [key in "TR" | "TL" | "BR" | "BL"]: string[] }>(),
      10: new Map<string, { [key in "TR" | "TL" | "BR" | "BL"]: string[] }>(),
      8: new Map<string, { [key in "TR" | "TL" | "BR" | "BL"]: string[] }>(),
      6: new Map<string, { [key in "TR" | "TL" | "BR" | "BL"]: string[] }>(),
      4: new Map<string, { [key in "TR" | "TL" | "BR" | "BL"]: string[] }>(),
    };

    // 1. load all spots
    const spots = await admin.firestore().collection("spots").get();

    // for each spot, add a point to the corresponding cluster tile for zoom 14
    const clusterTiles = new Map<string, SpotClusterTile>();
    spots.forEach((spot) => {
      const spotData: Spot.Schema = spot.data() as Spot.Schema;

      // get the tile for this zoom
      const tile14 =
        spotData.tile_coordinates[
          `z${14}` as keyof Spot.Schema["tile_coordinates"]
        ];

      const tileKey14 = `z${14}_${tile14.x}_${tile14.y}`;

      if (!clusterTiles.has(tileKey14)) {
        // if no tile exists for this spot,
        // create a new cluster tile object to add the point to
        clusterTiles.set(tileKey14, {
          zoom: 14,
          x: tile14.x,
          y: tile14.y,
          points: [],
        });
      }

      const clusterTile = clusterTiles.get(tileKey14);
      if (clusterTile) {
        clusterTile.points.push({
          location: spotData.location,
          weight: 1,
        });
      }

      // add this tile to the higherTilesMap
      const tile12 =
        spotData.tile_coordinates[
          `z${12}` as keyof Spot.Schema["tile_coordinates"]
        ];

      const getQuadrant = (tile: { x: number; y: number }) => {
        if ((tile.x >> 1) << 1 == tile.x) {
          if ((tile.y >> 1) << 1 == tile.y) {
            return "TL";
          } else {
            return "BL";
          }
        } else {
          if ((tile.y >> 1) << 1 == tile.y) {
            return "TR";
          } else {
            return "BR";
          }
        }
      };

      const quadrant = getQuadrant(tile14);

      if (!higherTilesMap[12].get(`z${12}_${tile12.x}_${tile12.y}`)) {
        higherTilesMap[12].set(`z${12}_${tile12.x}_${tile12.y}`, {
          TR: [],
          TL: [],
          BR: [],
          BL: [],
        });
      }

      const higherTile12 = higherTilesMap[12].get(
        `z${12}_${tile12.x}_${tile12.y}`
      );

      if (!higherTile12![quadrant].includes(tileKey14)) {
        higherTile12![quadrant].push(tileKey14);
      }
    });

    // 2.
    /// TODO
  });
