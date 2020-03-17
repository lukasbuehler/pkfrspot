import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp(functions.config().firebase);

/**
 * This function counts all the likes on one post and updates the number of likes on the post document. It is run everytime a like is added, updated or removed.
 */
export const countLikesOnWrite = functions.firestore
    .document("posts/{postId}/likes/{likeId}")
    .onWrite((change, context) => {
        //const likeId = context.params.likeId;
        const likedPostId = context.params.postId;

        const postRef = admin
            .firestore()
            .collection("posts")
            .doc(likedPostId);

        return postRef
            .collection("likes")
            .get()
            .then(snapshot => {
                const likeCount = snapshot.size;

                return postRef.update({ like_count: likeCount });
            });
    });

/**
 * This function clusters spots and puts them in a document for overviewing the spot map.
 * It runs every hour at 0 minutes.
 */
export const clusterSpots = functions.pubsub.schedule("'0 * * * *'").onRun(context => {
    console.log("Started clustering spots");
});
