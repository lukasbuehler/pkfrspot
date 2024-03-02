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
    const spots = await admin.firestore().collection("spots").get();

    spots.forEach((spot: Spot.Schema) => {
      // for each spot, adda a point of weight 1 to a cluster tile of zoom 14
    });
  });

export const clusterSpotsOnWrite = functions.firestore
  .document("spots/{spotId}")
  .onWrite(async (change, context) => {
    const spotData: Spot.Schema = change.after.data() as Spot.Schema;

    const tileCoordinates = spotData.tile_coordinates;

    for (let zoom = 12; zoom >= 2; zoom += 2) {
      const tile =
        tileCoordinates[`z${zoom}` as keyof Spot.Schema["tile_coordinates"]];

      const updatedSpotClusterTile: SpotClusterTile = {
        zoom: zoom,
        x: tile.x,
        y: tile.y,
        points: [],
      };

      await admin
        .firestore()
        .collection("spot_clusters")
        .doc(`z${zoom}_${tile.x}_${tile.y}`)
        .set(updatedSpotClusterTile, { merge: false });
    }
  });
