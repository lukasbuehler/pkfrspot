import { Injectable } from "@angular/core";

import { Post } from "src/scripts/db/Post";
import { Spot } from "src/scripts/db/Spot";

import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentChangeAction,
  DocumentChangeType,
} from "@angular/fire/compat/firestore";

import { Observable } from "rxjs";
import { Like } from "src/scripts/db/Like";
import { User } from "src/scripts/db/User";
import { merge } from "rxjs";
import { map } from "rxjs/operators";
import * as firebase from "firebase/compat";
import { InviteCode } from "src/scripts/db/InviteCode";

@Injectable({
  providedIn: "root",
})
export class DatabaseService {
  constructor(private db: AngularFirestore) {}

  docRef(path: string) {
    return this.db.doc(path).ref;
  }

  // Posts --------------------------------------------------------------------

  addPost(newPost: Post.Schema) {
    this.db
      .collection<Post.Schema>("posts")
      .add(newPost)
      .then((docRef) => {
        console.log("Post Document written with ID: " + docRef.id);
      })
      .catch((error) => {
        console.error("Error adding Post Document: ", error);
        console.log(newPost);

        // remove the uploaded data after...
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
     * 2) Make multiple arrays of size 10 with all the followings
     * 3) Call all the observables to those batches of 10 users with in queries for posts with pagination.
     * 4) Construct one giant observable with all those listeners
     * 5) Return that
     */

    return new Observable<{ type: DocumentChangeType; post: Post.Class }[]>(
      (obs) => {
        // 1) Get all the followings of the currently authenticated user
        let allFollowingsIds: string[] = [];
        this.db
          .collection<User.FollowingDataSchema>(`users/${userId}/following`)
          .get()
          .subscribe((snap) => {
            // Gets the followers once, the user will need to refresh to display post of newly following users.

            allFollowingsIds = snap.docs.map((val) => {
              return val.id;
            });

            // add the currently authenticated user to the Ids
            // We want to see our own posts as well
            allFollowingsIds.unshift(userId);

            if (allFollowingsIds.length === 0) {
              // This user doesn't follow anyone, just complete the observable.
              //
              obs.complete();
            }

            // 2) Make multiple arrays of size 10 with all the followings
            let chunks: string[][] = [];
            const chunkSize = 10;
            for (
              let beginIndex = 0, endIndex = allFollowingsIds.length;
              beginIndex < endIndex;
              beginIndex += chunkSize
            ) {
              chunks.push(
                allFollowingsIds.slice(beginIndex, beginIndex + chunkSize)
              );
            }

            // 3) Call all the observables to those batches of 10 users with in queries for posts with pagination.
            let observables: Observable<DocumentChangeAction<Post.Schema>[]>[] =
              [];
            chunks.forEach((ids: string[]) => {
              observables.push(
                this.db
                  .collection<Post.Schema>(
                    "posts",
                    (ref) =>
                      ref
                        .where("user.uid", "in", ids)
                        .orderBy("time_posted", "desc")
                        .limit(10)
                    // TODO Pagination
                  )
                  .snapshotChanges()
              );
            });
            merge(...observables).subscribe(
              (changeActions) => {
                let postChanges: {
                  type: DocumentChangeType;
                  post: Post.Class;
                }[] = [];
                changeActions.forEach((action) => {
                  const id = action.payload.doc.id;
                  const data = action.payload.doc.data();
                  const _post = new Post.Class(id, data);
                  postChanges.push({ type: action.type, post: _post });
                });
                obs.next(postChanges);
              },
              (err) => {
                obs.error(err);
              }
            );
          });
      }
    );
  }

  /**
   * Top posts in the last 24 hours
   * @returns a map of post schemas with the IDs as the keys and the data as the values
   */
  getTodaysTopPosts(): Observable<any> {
    return new Observable<any>((observer) => {
      const twentyFourHoursInMilliSeconds = 24 * 60 * 60 * 1000;
      const yesterday = new Date(Date.now() - twentyFourHoursInMilliSeconds);
      this.db
        .collection<Post.Schema>(
          "posts",
          (ref) =>
            ref
              //.where("time_posted", ">", yesterday)
              .orderBy("like_count", "desc")
              .orderBy("time_posted", "desc")
              .limit(10)
          // TODO Pagination
        )
        .snapshotChanges()
        .subscribe(
          (changeActions) => {
            const postSchemasMap: any = {};
            changeActions.forEach((action) => {
              const id = action.payload.doc.id;
              postSchemasMap[id] = action.payload.doc.data();
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
      let snapshotChanges = this.db
        .collection<Post.Schema>("posts", (ref) =>
          ref.where("spot.ref", "==", this.docRef("spots/" + spot.id)).limit(10)
        )
        .snapshotChanges();

      snapshotChanges.subscribe(
        (changeActions) => {
          let postSchemasMap: any = {};
          changeActions.forEach((action) => {
            const id = action.payload.doc.id;
            postSchemasMap[id] = action.payload.doc.data();
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
    // currently loading all posts, add pagination // TODO
    return new Observable<Post.Schema>((observer) => {
      let snapshotChanges = this.db
        .collection<Post.Schema>("posts", (ref) =>
          ref.where("user.uid", "==", userId)
        )
        .snapshotChanges();

      snapshotChanges.subscribe(
        (changeActions) => {
          let postSchemasMap: any = {};
          changeActions.forEach((action) => {
            const id = action.payload.doc.id;
            postSchemasMap[id] = action.payload.doc.data();
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
    return new Promise<void>((resolve, reject) => {
      if (!postId) {
        reject("The post ID is invalid");
      }

      this.db
        .collection<Post.Schema>("posts")
        .doc(postId)
        .delete()
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  // Post Likes

  userHasLikedPost(postId: string, userId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.db
        .collection<Like.Schema>(`posts/${postId}/likes`)
        .doc(userId)
        .get()
        .subscribe(
          (snap) => {
            if (snap.exists) {
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
    return new Promise<void>((resolve, reject) => {
      if (userUID !== newLike.user.uid) {
        reject("The User ID and User ID on the like don't match!");
      }

      this.db
        .collection<Like.Schema>(`posts/${postId}/likes`)
        .doc(userUID)
        .set(newLike)
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  removeLike(postId: string, userUID: string): Promise<void> {
    return this.db
      .collection<Like.Schema>(`posts/${postId}/likes`)
      .doc(userUID)
      .delete();
  }

  // Spots --------------------------------------------------------------------

  getTestSpots(isNotForMap?: boolean): Observable<Spot.Class[]> {
    return new Observable<Spot.Class[]>((observer) => {
      this.db
        .collection<Spot.Schema>("spots", (ref) =>
          ref.orderBy("name", "asc").limit(10)
        )
        .get()
        .subscribe(
          (querySnapshot) => {
            let spots: Spot.Class[] = [];

            querySnapshot.forEach((doc) => {
              if (doc.data() as Spot.Schema) {
                let newSpot: Spot.Class = new Spot.Class(
                  doc.id,
                  doc.data() as Spot.Schema,
                  !!isNotForMap
                );
                console.log(newSpot);

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
      this.db
        .collection<Spot.Schema>("spots")
        .doc<Spot.Schema>(spotId)
        .get()
        .subscribe(
          (snap) => {
            if(snap.exists)
            {
              let spot = new Spot.Class(snap.id, snap.data() as Spot.Schema);
              observer.next(spot);
            }
            else {
              observer.error({msg: "Error! This Spot does not exist."})
            }
          },
          (error) => {
            observer.error({msg: "Error! There was a problem loading this spot.", debug: error});
          }
        );
    });
  }

  getSpotsForTiles(tiles: { x: number; y: number }[]) {
    return new Observable<Spot.Class[]>((observer) => {
      for (let tile of tiles) {
        this.db
          .collection<Spot.Schema>("spots", (ref) =>
            ref
              .where("tile_coordinates.z16.x", "==", tile.x)
              .where("tile_coordinates.z16.y", "==", tile.y)
          )
          .get()
          .subscribe(
            (snapshot) => {
              observer.next(this.parseSpots(snapshot));
            },
            (error) => {
              observer.error(error);
            }
          );
      }
    });
  }

  getPreviewSpotsForTiles(zoom: number, tiles: { x: number; y: number }[]) {
    return new Observable<Spot.Class[]>((observer) => {
      for (let tile of tiles) {
        this.db
          .collection<Spot.Schema>("spots", (ref) =>
            ref
              .where(`tile_coordinates.z${zoom}.x`, "==", tile.x)
              .where(`tile_coordinates.z${zoom}.y`, "==", tile.y)
              .limit(10)
          )
          .get()
          .subscribe(
            (snapshot) => {
              observer.next(this.parseSpots(snapshot));
            },
            (error) => {
              observer.error(error);
            }
          );
      }
    });
  }

  private parseSpots(snapshot): Spot.Class[] {
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
      this.db.collection<Spot.Schema>("spots").get();
    });
  }

  createSpot(spotData: Spot.Schema): Observable<any> {
    return new Observable<any>((observer) => {
      this.db
        .collection<Spot.Schema>("spots")
        .add(spotData)
        .then(
          /* fulfilled */ (value) => {
            observer.next(value);
            observer.complete();
          },
          /* rejected */ (reason) => {
            observer.error(reason);
          }
        )
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  setSpot(spotId: string, spotData: Spot.Schema): Observable<any> {
    return new Observable<any>((observer) => {
      this.db
        .collection<Spot.Schema>("spots")
        .doc(spotId)
        .set(spotData)
        .then(
          /* fulfilled */ (value) => {
            observer.next(value);
            observer.complete();
          },
          /* rejected */ (reason) => {
            observer.error(reason);
          }
        )
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  updateSpot(
    spotId: string,
    spotUpdateData: Partial<Spot.Schema>
  ): Promise<void> {
    return this.db
      .collection<Spot.Schema>("spots")
      .doc(spotId)
      .update(spotUpdateData);
  }

  // Users --------------------------------------------------------------------

  addUser(
    userId: string,
    display_name: string,
    data: User.Schema
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let schema: User.Schema = {
        display_name: display_name,
        verified_email: false,
        ...data,
      }
      this.db
        .collection<User.Schema>("users")
        .doc(userId)
        .set(schema).then(() => resolve()).catch((err) => reject(err));
    });
  }

  getUserById(userId) {
    return new Observable<User.Class>((observer) => {
      this.db
        .collection<User.Schema>("users")
        .doc<User.Schema>(userId)
        .get()
        .subscribe(
          (snap) => {
            let user = new User.Class(snap.id, snap.data() as User.Schema);
            observer.next(user);
          },
          (err) => {
            observer.error(err);
          }
        );
    });
  }

  updateUser(userId: string, _data: User.Schema, _merge: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      this.db
        .collection<User.Schema>("users")
        .doc(userId)
        .set(_data, { merge: _merge })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  deleteUser() {
    // TODO
  }

  // Following

  isFollowingUser(myUserId: string, otherUserId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.db
        .collection<User.FollowingDataSchema>(`users/${myUserId}/following`)
        .doc(otherUserId)
        .get()
        .subscribe(
          (snap) => {
            if (snap.exists) {
              resolve(true);
            } else {
              resolve(false);
            }
          },
          (err) => {
            reject(err);
          }
        );
    });
  }

  userIsFollowingYou(myUserId: string, otherUserId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.db
        .collection<User.FollowingDataSchema>(`users/${myUserId}/followers`)
        .doc(otherUserId)
        .get()
        .subscribe(
          (snap) => {
            if (snap.exists) {
              resolve(true);
            } else {
              resolve(false);
            }
          },
          (err) => {
            reject(err);
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
    return new Promise<void>((resolve, reject) => {
      if (!myUserId) {
        reject("Your User ID is empty");
      }
      if (!otherUserId) {
        reject("The User ID of the user you want to follow is empty");
      }
      if (!otherUserData || !otherUserData.display_name) {
        reject("The User data of the user you want to follow is not valid");
      }

      let followingData: User.FollowingDataSchema = {
        display_name: otherUserData.display_name,
        profile_picture: otherUserData.profile_picture || "",
        start_following: new firebase.default.firestore.Timestamp(
          Date.now() / 1000,
          0
        ),
      };
      let followerData: User.FollowingDataSchema = {
        display_name: myUserData.display_name,
        profile_picture: myUserData.profile_picture,
        start_following: new firebase.default.firestore.Timestamp(
          Date.now() / 1000,
          0
        ),
      };
      this.db
        .collection<User.FollowingDataSchema>(`users/${myUserId}/following`)
        .doc(otherUserId)
        .set(followingData)
        .then(() => {
          // TODO Eventually this part should be handled by a cloud function
          this.db
            .collection<User.FollowingDataSchema>(
              `users/${otherUserId}/followers`
            )
            .doc(myUserId)
            .set(followerData)
            .then(() => {
              // Now we can resolve it
              resolve();
            })
            .catch((err) => {
              console.error(
                "Error on setting the following data on the other user"
              );
              reject(err);
            });
        })
        .catch((err) => {
          console.error("Error while setting the following data on my User");
          reject(err);
        });
    });
  }

  unfollowUser(myUserId: string, otherUserId: string) {
    return new Promise<void>((resolve, reject) => {
      this.db
        .collection<User.FollowingDataSchema>(`users/${myUserId}/following`)
        .doc(otherUserId)
        .delete()
        .then(() => {
          // Now delete it from the follower list as well
          this.db
            .collection<User.FollowingDataSchema>(
              `users/${otherUserId}/followers`
            )
            .doc(myUserId)
            .delete()
            .then(() => {
              // Now we can resolve it
              resolve();
            })
            .catch((err) => {
              console.error(
                "Error deleting my user from the other users followers list"
              );
              reject(err);
            });
        })
        .catch((err) => {
          console.error("Error deleting the other user from my following list");
          reject(err);
        });
    });
  }

  /**
   * Gets the current followers of a user. (Not updated live)
   * @param userId
   * @returns
   */
  getFollowersOfUser(
    userId: string,
    chunkSize: number = 20,
    startAfter?: firebase.default.firestore.Timestamp
  ) {
    if (!startAfter)
      startAfter = new firebase.default.firestore.Timestamp(
        Date.now() / 1000,
        0
      );

    return this.db
      .collection<User.FollowingDataSchema>(
        `users/${userId}/followers`,
        (ref) =>
          ref
            .orderBy("start_following", "desc")
            .startAfter(startAfter)
            .limit(chunkSize)
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((doc) => {
            const data = doc.data() as User.FollowingSchema;
            return {
              ...data,
              uid: doc.id,
            };
          });
        })
      );
  }

  /**
   * Gets the current following of a user. (Not updated live)
   * @param userId
   * @returns
   */
  getFollowingsOfUser(
    userId: string,
    chunkSize: number = 20,
    startAfter?: firebase.default.firestore.Timestamp
  ): Observable<User.FollowingSchema[]> {
    if (!startAfter)
      startAfter = new firebase.default.firestore.Timestamp(
        Date.now() / 1000,
        0
      );

    return this.db
      .collection<User.FollowingDataSchema>(
        `users/${userId}/following`,
        (ref) =>
          ref
            .orderBy("start_following", "desc")
            .startAfter(startAfter)
            .limit(chunkSize)
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((doc) => {
            const data = doc.data() as User.FollowingSchema;
            return {
              ...data,
              uid: doc.id,
            };
          });
        })
      );
  }

  // Other

  checkInviteCode(inviteCode: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.db
        .doc<InviteCode.Schema>(`invite_codes/${inviteCode}`)
        .get()
        .subscribe(
          (doc) => {
            const data = doc.data() as InviteCode.Schema;

            if(!data)
            {
              // The invite code is invalid!
              resolve(false);
            }

            if (data.uses_left > 0) {
              resolve(true);
            } else {
              resolve(false);
            }
          },
          (error) => {
            console.log("obs error", error);
            resolve(false);
          }
        );
    });
  }

  useInviteCode(inviteCode: string): Promise<InviteCode.Schema> {
    return new Promise<InviteCode.Schema>((resolve, reject) => {
      this.db
        .doc<InviteCode.Schema>(`invite_codes/${inviteCode}`)
        .get()
        .subscribe(
          (doc) => {
            const data = doc.data() as InviteCode.Schema;

            if (data.uses_left > 0) {
              resolve(data);
              // now subtract one use
            } else {
              reject("No uses left!");
            }
          },
          (error) => {
            console.log("obs error", error);
            reject(error);
          }
        );
    });
  }
}
