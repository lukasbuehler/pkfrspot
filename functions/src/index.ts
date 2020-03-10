import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

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
