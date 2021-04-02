import { Injectable } from "@angular/core";

import { Post } from "src/scripts/db/Post";
import { Spot } from "src/scripts/db/Spot";

import {
  AngularFirestore,
  AngularFirestoreCollection,
} from "@angular/fire/firestore";

import { Observable } from "rxjs";
import { Like } from "src/scripts/db/Like";
import { User } from "src/scripts/db/User";

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
  getPostUpdates(userId): Observable<any> {
    /**
     * 1) Get all followings of the currently authenticated user
     * 2) Make multiple arrays of size 10 with all the followings
     * 3) Call all the observables to those batches of 10 users with in queries for posts with pagination.
     * 4) Construct one giant observable with all those listeners
     * 5) Return that
     */

    return new Observable<any>((observer) => {
      let snapshotChanges = this.db
        .collection<Post.Schema>("posts", (ref) =>
          ref.orderBy("time_posted", "desc").limit(10)
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

  getTrendingPosts() {}

  /**
   * Top posts in the last 24 hours
   * @returns a map of post schemas with the IDs as the keys and the data as the values
   */
  getTodaysTopPosts(): Observable<any> {
    return new Observable<any>((observer) => {
      const twentyFourHoursInMilliSeconds = 24 * 60 * 60 * 1000;
      const yesterday = new Date(Date.now() - twentyFourHoursInMilliSeconds);
      console.log("yesterday", yesterday);
      this.db
        .collection<Post.Schema>(
          "posts",
          (ref) =>
            ref
              .where("time_posted", ">", yesterday)
              .orderBy("time_posted", "desc")
              .orderBy("like_count", "desc")
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
            let spot = new Spot.Class(snap.id, snap.data() as Spot.Schema);
            observer.next(spot);
          },
          (error) => {
            observer.error(error);
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

  // Users --------------------------------------------------------------------

  addUser(userId, display_name): Promise<User.Schema> {
    return new Promise<User.Schema>((resolve, reject) => {
      this.db.collection("users").doc(userId).set({
        display_name: display_name,
        verified_email: false,
      });
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

  isFollowingUser(myUserId: string, otherUserId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.db
        .collection<User.FollowingSchema>(`users/${myUserId}/following`)
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
        .collection<User.FollowingSchema>(`users/${myUserId}/followers`)
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

      let followingData: User.FollowingSchema = {
        display_name: otherUserData.display_name,
        profile_picture: otherUserData.profile_picture || "",
      };
      let followerData: User.FollowingSchema = {
        display_name: myUserData.display_name,
        profile_picture: myUserData.profile_picture,
      };
      this.db
        .collection<User.FollowingSchema>(`users/${myUserId}/following`)
        .doc(otherUserId)
        .set(followingData)
        .then(() => {
          // TODO Eventually this part should be handled by a cloud function
          this.db
            .collection<User.FollowingSchema>(`users/${otherUserId}/followers`)
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
        .collection<User.FollowingSchema>(`users/${myUserId}/following`)
        .doc(otherUserId)
        .delete()
        .then(() => {
          // Now delete it from the follower list as well
          this.db
            .collection<User.FollowingSchema>(`users/${otherUserId}/followers`)
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
}
