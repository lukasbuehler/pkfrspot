import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp(functions.config().firebase);

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
