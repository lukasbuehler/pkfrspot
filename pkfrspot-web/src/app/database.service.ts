import { Injectable } from "@angular/core";

import { Post } from "src/scripts/db/Post";
import { Spot } from "src/scripts/db/Spot";

import {
  Firestore,
  doc,
  addDoc,
  collection,
  onSnapshot,
  DocumentChangeType,
  where,
  query,
  orderBy,
  limit,
  deleteDoc,
  setDoc,
  startAfter,
} from "@angular/fire/firestore";

import { Observable, forkJoin } from "rxjs";
import { Like } from "src/scripts/db/Like";
import { User } from "src/scripts/db/User";
import { map, take } from "rxjs/operators";
import { DocumentReference, Timestamp, updateDoc } from "firebase/firestore";

@Injectable({
  providedIn: "root",
})
export class DatabaseService {
  constructor(private firestore: Firestore) {}

  docRef(path: string): DocumentReference {
    return doc(this.firestore, path);
  }

  // Posts --------------------------------------------------------------------

  addPost(newPost: Post.Schema) {
    let postsCollectionRef = collection(this.firestore, "posts");

    addDoc(postsCollectionRef, newPost)
      .then((docRef) => {
        console.log("Post Document written with ID: " + docRef.id);
      })
      .catch((error) => {
        console.error("Error adding Post Document: ", error);
        console.log(newPost);

        // remove the uploaded data after...
        // TODO
      });
  }

  /**
   *
   * @returns
   */
  getPostUpdates(
    userId
  ): Observable<{ type: DocumentChangeType; post: Post.Class }[]> {
    /**
     * 1) Get all followings of the currently authenticated user
     * 2) Make multiple arrays of fixed size with all the followings
     * 3) Call all the observables to those batches of 10 users with in queries for posts with pagination.
     * 4) Construct one giant observable with all those listeners
     * 5) Return that
     */

    return new Observable<{ type: DocumentChangeType; post: Post.Class }[]>(
      (obs) => {}
    );
  }

  /**
   * Top posts in the last 24 hours
   * @returns a map of post schemas with the IDs as the keys and the data as the values
   */
  getTodaysTopPosts(): Observable<any> {
    const twentyFourHoursInMilliSeconds = 24 * 60 * 60 * 1000;
    const yesterday = new Date(Date.now() - twentyFourHoursInMilliSeconds);

    return new Observable<any>((observer) => {
      return onSnapshot(
        query(
          collection(this.firestore, "posts"),
          //.where("time_posted", ">", yesterday)
          orderBy("like_count", "desc"),
          orderBy("time_posted", "desc"),
          limit(10)
          // TODO Pagination
        ),
        (querySnapshot) => {
          const postSchemasMap: any = {};
          querySnapshot.forEach((doc) => {
            const id = doc.id;
            postSchemasMap[id] = doc.data();
          });
          observer.next(postSchemasMap);
        },
        (err) => {
          observer.error(err);
        }
      );
    });
  }

  /**
   * Gets the posts lined to a spot
   * @param spot The spot class we want to find the posts for
   * @returns a map of post schemas with the IDs as the keys and the data as the values
   */
  getPostsFromSpot(spot: Spot.Class): Observable<Post.Schema> {
    return new Observable<Post.Schema>((observer) => {
      return onSnapshot(
        query(
          collection(this.firestore, "posts"),
          where("spot.ref", "==", this.docRef("spots/" + spot.id)),
          limit(10)
        ),
        (querySnapshot) => {
          let postSchemasMap: any = {};
          querySnapshot.forEach((doc) => {
            const id = doc.id;
            postSchemasMap[id] = doc.data();
          });

          observer.next(postSchemasMap);
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  getPostsFromUser(userId: string): Observable<Post.Schema> {
    return new Observable<Post.Schema>((observer) => {
      return onSnapshot(
        query(
          collection(this.firestore, "posts"),
          where("user.uid", "==", userId),
          limit(10) // TODO Pagination
        ),
        (querySnapshot) => {
          let postSchemasMap: any = {};
          querySnapshot.forEach((doc) => {
            const id = doc.id;
            postSchemasMap[id] = doc.data();
          });

          observer.next(postSchemasMap);
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  deletePost(postId): Promise<void> {
    if (!postId) {
      return Promise.reject("The post ID is empty");
    }

    return deleteDoc(doc(this.firestore, "posts", postId));
  }

  // Post Likes

  userHasLikedPost(postId: string, userId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      return onSnapshot(
        doc(this.firestore, `posts/${postId}/likes/${userId}`),
        (snap) => {
          if (snap.exists()) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  addLike(
    postId: string,
    userUID: string,
    newLike: Like.Schema
  ): Promise<void> {
    if (userUID !== newLike.user.uid) {
      return Promise.reject("The User ID and User ID on the like don't match!");
    }

    return setDoc(
      doc(this.firestore, `posts/${postId}/likes/${userUID}`),
      newLike
    );
  }

  removeLike(postId: string, userUID: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `posts/${postId}/likes/${userUID}`));
  }

  // Spots --------------------------------------------------------------------

  getTestSpots(isNotForMap?: boolean): Observable<Spot.Class[]> {
    return new Observable<Spot.Class[]>((observer) => {
      return onSnapshot(
        query(
          collection(this.firestore, "spots"),
          orderBy("name", "asc"),
          limit(50)
        ),
        (querySnapshot) => {
          let spots: Spot.Class[] = [];

          querySnapshot.forEach((doc) => {
            if (doc.data() as Spot.Schema) {
              let newSpot: Spot.Class = new Spot.Class(
                doc.id,
                doc.data() as Spot.Schema
              );
              spots.push(newSpot);
            } else {
              console.error("Spot could not be cast to Spot.Schema!");
              observer.complete();
            }
          });

          observer.next(spots);
          observer.complete();
        },
        (error) => {
          observer.error(error);
          observer.complete();
        },
        () => {}
      );
    });
  }

  getSpotById(spotId: string) {
    return new Observable<Spot.Class>((observer) => {
      return onSnapshot(
        doc(this.firestore, "spots", spotId),
        (snap) => {
          if (snap.exists) {
            let spot = new Spot.Class(snap.id, snap.data() as Spot.Schema);
            observer.next(spot);
          } else {
            observer.error({ msg: "Error! This Spot does not exist." });
          }
        },
        (error) => {
          observer.error({
            msg: "Error! There was a problem loading this spot.",
            debug: error,
          });
        }
      );
    });
  }

  getSpotsForTiles(
    tiles: { x: number; y: number }[]
  ): Observable<Spot.Class[]> {
    const observables = tiles.map((tile) => {
      return new Observable<Spot.Class[]>((observer) => {
        const unsubscribe = onSnapshot(
          query(
            collection(this.firestore, "spots"),
            where("tile_coordinates.z16.x", "==", tile.x),
            where("tile_coordinates.z16.y", "==", tile.y)
          ),
          (snap) => {
            observer.next(this.parseSpots_(snap));
          },
          (error) => {
            observer.error(error);
          }
        );

        return () => {
          unsubscribe();
        };
      }).pipe(take(1));
    });

    return forkJoin(observables).pipe(
      map((arrays: Spot.Class[][]) => {
        let allSpots = new Map<string, Spot.Class>();

        arrays.forEach((spots: Spot.Class[]) => {
          spots.forEach((spot: Spot.Class) => {
            allSpots.set(spot.id, spot);
          });
        });

        return Array.from(allSpots.values());
      })
    );
  }

  getPreviewSpotsForTiles(zoom: number, tiles: { x: number; y: number }[]) {
    return new Observable<Spot.Class[]>((observer) => {
      const tileUnsubscribeFunctions: (() => void)[] = [];

      for (let tile of tiles) {
        tileUnsubscribeFunctions.push(
          onSnapshot(
            query(
              collection(this.firestore, "spots"),
              where(`tile_coordinates.z${zoom}.x`, "==", tile.x),
              where(`tile_coordinates.z${zoom}.y`, "==", tile.y),
              limit(10)
            ),
            (snap) => {
              observer.next(this.parseSpots_(snap));
            },
            (error) => {
              observer.error(error);
            }
          )
        );
      }

      return () => {
        // unsubscribe from all onSnapshots for each tile
        tileUnsubscribeFunctions.forEach((unsubscribe) => {
          unsubscribe();
        });
      };
    });
  }

  private parseSpots_(snapshot): Spot.Class[] {
    let newSpots: Spot.Class[] = [];

    snapshot.forEach((doc) => {
      if (doc.data() as Spot.Schema) {
        let newSpot: Spot.Class = new Spot.Class(
          doc.id,
          doc.data() as Spot.Schema
        );
        newSpots.push(newSpot);
      } else {
        console.error("Spot could not be cast to Spot.Schema!");
      }
    });

    return newSpots;
  }

  getSpotSearch(searchString: string): Observable<Spot.Class[]> {
    return new Observable<any[]>((observer) => {
      // TODO
    });
  }

  createSpot(spotData: Spot.Schema): Promise<any> {
    return addDoc(collection(this.firestore, "spots"), spotData);
  }

  setSpot(spotId: string, spotData: Spot.Schema): Promise<any> {
    return setDoc(doc(this.firestore, "spots", spotId), spotData);
  }

  updateSpot(
    spotId: string,
    spotUpdateData: Partial<Spot.Schema>
  ): Promise<void> {
    return updateDoc(doc(this.firestore, "spots", spotId), spotUpdateData);
  }

  // Users --------------------------------------------------------------------

  addUser(
    userId: string,
    display_name: string,
    data: User.Schema
  ): Promise<void> {
    let schema: User.Schema = {
      display_name: display_name,
      verified_email: false,
      ...data,
    };

    return setDoc(doc(this.firestore, "users", userId), schema);
  }

  /**
   * Retrieves a user from firestore by their user ID.
   * @param userId
   * @returns Returns the user class if found an null if not found.
   */
  getUserById(userId): Observable<User.Class | null> {
    return new Observable<User.Class | null>((observer) => {
      return onSnapshot(
        doc(this.firestore, "users", userId),
        (snap) => {
          if (snap.exists()) {
            let user = new User.Class(snap.id, snap.data() as User.Schema);
            observer.next(user);
          } else {
            observer.next(null);
          }
        },
        (err) => {
          observer.error(err);
        }
      );
    });
  }

  updateUser(userId: string, _data: Partial<User.Schema>) {
    return updateDoc(doc(this.firestore, "users", userId), _data);
  }

  deleteUser() {
    // TODO
  }

  // Following

  isFollowingUser(myUserId: string, otherUserId: string): Observable<boolean> {
    return new Observable<boolean>((obs) => {
      return onSnapshot(
        doc(this.firestore, "users", myUserId, "following", otherUserId),
        (snap) => {
          if (snap.exists) {
            obs.next(true);
          } else {
            obs.next(false);
          }
        },
        (err) => {
          obs.error(err);
        }
      );
    });
  }

  userIsFollowingYou(
    myUserId: string,
    otherUserId: string
  ): Observable<boolean> {
    return new Observable<boolean>((obs) => {
      return onSnapshot(
        doc(this.firestore, "users", myUserId, "followers", otherUserId),
        (snap) => {
          if (snap.exists) {
            obs.next(true);
          } else {
            obs.next(false);
          }
        },
        (err) => {
          obs.error(err);
        }
      );
    });
  }

  /**
   *
   * @param myUserId
   * @param otherUserId
   * @param otherUserData
   * @returns A promise of type void that resolves upon successful follow creation.
   */
  followUser(
    myUserId: string,
    myUserData: User.Schema,
    otherUserId: string,
    otherUserData: User.Schema
  ): Promise<void> {
    if (!myUserId) {
      return Promise.reject("Your User ID is empty");
    }
    if (!otherUserId) {
      return Promise.reject(
        "The User ID of the user you want to follow is empty"
      );
    }
    if (!otherUserData || !otherUserData.display_name) {
      return Promise.reject(
        "The User data of the user you want to follow is not valid"
      );
    }

    let followingData: User.FollowingDataSchema = {
      display_name: otherUserData.display_name,
      profile_picture: otherUserData.profile_picture || "",
      start_following: new Timestamp(Date.now() / 1000, 0),
    };
    let followerData: User.FollowingDataSchema = {
      display_name: myUserData.display_name,
      profile_picture: myUserData.profile_picture,
      start_following: new Timestamp(Date.now() / 1000, 0),
    };
    return setDoc(
      doc(this.firestore, "users", myUserId, "following", otherUserId),
      followingData
    ).then(() => {
      // TODO Eventually this part should be handled by a cloud function
      return setDoc(
        doc(this.firestore, "users", otherUserId, "followers", myUserId),
        followerData
      );
    });
  }

  unfollowUser(myUserId: string, otherUserId: string) {
    return deleteDoc(
      doc(this.firestore, "users", myUserId, "following", otherUserId)
    ).then(() => {
      // Now delete it from the follower list as well
      return deleteDoc(
        doc(this.firestore, "users", otherUserId, "followers", myUserId)
      );
    });
  }

  /**
   * Gets the current followers of a user. (Not updated live)
   * @param userId
   * @returns
   */
  getFollowersOfUser(
    userId: string,
    chunkSize: number = 20
  ): Observable<User.FollowingSchema[]> {
    return new Observable<User.FollowingSchema[]>((obs) => {
      return onSnapshot(
        query(
          collection(this.firestore, `users/${userId}/followers`),
          orderBy("start_following", "desc"),
          // TODO pagination
          limit(chunkSize)
        ),
        (snap) => {
          const followers = snap.docs.map((doc) => {
            const data = doc.data() as User.FollowingSchema;
            return {
              ...data,
              uid: doc.id,
            };
          });
          obs.next(followers);
        },
        (err) => {
          obs.error(err);
        }
      );
    });
  }

  /**
   * Gets the current following of a user. (Not updated live)
   * @param userId
   * @returns
   */
  getFollowingsOfUser(
    userId: string,
    chunkSize: number = 20
  ): Observable<User.FollowingSchema[]> {
    return new Observable<User.FollowingSchema[]>((obs) => {
      return onSnapshot(
        query(
          collection(this.firestore, `users/${userId}/following`),
          orderBy("start_following", "desc"),
          // TODO pagination
          limit(chunkSize)
        ),
        (snap) => {
          const followers = snap.docs.map((doc) => {
            const data = doc.data() as User.FollowingSchema;
            return {
              ...data,
              uid: doc.id,
            };
          });
          obs.next(followers);
        },
        (err) => {
          obs.error(err);
        }
      );
    });
  }

  // Other

  //   checkInviteCode(inviteCode: string): Promise<boolean> {
  //     return new Promise<boolean>((resolve, reject) => {
  //       this.db
  //         .doc<InviteCode.Schema>(`invite_codes/${inviteCode}`)
  //         .get()
  //         .subscribe(
  //           (doc) => {
  //             const data = doc.data() as InviteCode.Schema;

  //             if (!data) {
  //               // The invite code is invalid!
  //               resolve(false);
  //             }

  //             if (data.uses_left > 0) {
  //               resolve(true);
  //             } else {
  //               resolve(false);
  //             }
  //           },
  //           (error) => {
  //             console.log("obs error", error);
  //             resolve(false);
  //           }
  //         );
  //     });
  //   }

  //   useInviteCode(inviteCode: string): Promise<InviteCode.Schema> {
  //     return new Promise<InviteCode.Schema>((resolve, reject) => {
  //       this.db
  //         .doc<InviteCode.Schema>(`invite_codes/${inviteCode}`)
  //         .get()
  //         .subscribe(
  //           (doc) => {
  //             const data = doc.data() as InviteCode.Schema;

  //             if (data.uses_left > 0) {
  //               resolve(data);
  //               // now subtract one use
  //             } else {
  //               reject("No uses left!");
  //             }
  //           },
  //           (error) => {
  //             console.log("obs error", error);
  //             reject(error);
  //           }
  //         );
  //     });
  //   }
}
