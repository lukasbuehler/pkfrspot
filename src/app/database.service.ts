import { Injectable } from "@angular/core";

import { Post } from "../scripts/db/Post";
import { Spot } from "../scripts/db/Spot";

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
import { Like } from "../scripts/db/Like";
import { User } from "../scripts/db/User";
import { map, take } from "rxjs/operators";
import {
  DocumentData,
  DocumentReference,
  QuerySnapshot,
  Timestamp,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  ClusterTileKey,
  getDataFromClusterTileKey,
  SpotClusterTile,
} from "../scripts/db/SpotClusterTile";
import { SpotReport } from "../scripts/db/SpotReport";

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

    console.debug("Adding like to post", postId, "by user", userUID, newLike);

    return setDoc(
      doc(this.firestore, `posts/${postId}/likes/${userUID}`),
      newLike
    );
  }

  removeLike(postId: string, userUID: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `posts/${postId}/likes/${userUID}`));
  }

  // Spots --------------------------------------------------------------------

  getSpotById(spotId: string) {
    return new Observable<Spot.Class>((observer) => {
      return onSnapshot(
        doc(this.firestore, "spots", spotId),
        (snap) => {
          if (snap.exists) {
            const data = snap.data() as Spot.Schema;
            let spot = new Spot.Class(snap.id, data);
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

  getSpotsForTileKeys(tileKeys: ClusterTileKey[]): Observable<Spot.Class[]> {
    const tiles = tileKeys.map((key) => getDataFromClusterTileKey(key));
    return this.getSpotsForTiles(tiles);
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

  /**
   * Load all the cluster tile for all the given keys from firestore,
   * and return only once all of them are loaded using forkJoin.
   * @param tiles All the tile keys to load
   * @returns
   */
  getSpotClusterTiles(tiles: ClusterTileKey[]): Observable<SpotClusterTile[]> {
    const observables = tiles.map((tile) => {
      return new Observable<SpotClusterTile[]>((observer) => {
        const unsubscribe = onSnapshot(
          doc(this.firestore, "spot_clusters", tile),
          (snap) => {
            if (snap.exists()) {
              observer.next([snap.data() as SpotClusterTile]);
            } else {
              observer.next([]);
            }
          },
          (error) => {
            console.error(error);
            observer.error(error);
          }
        );
        return () => {
          unsubscribe();
        };
      }).pipe(take(1));
    });

    return forkJoin(observables).pipe(
      map((arrays: SpotClusterTile[][]) => {
        let allTiles = new Array<SpotClusterTile>();

        arrays.forEach((tiles: SpotClusterTile[]) => {
          tiles.forEach((tile: SpotClusterTile) => {
            allTiles.push(tile);
          });
        });

        return allTiles;
      })
    );
  }

  private parseSpots_(snapshot: QuerySnapshot<DocumentData>): Spot.Class[] {
    let newSpots: Spot.Class[] = [];

    snapshot.forEach((doc) => {
      const data: any = doc.data();
      const spotData: Spot.Schema = data as Spot.Schema;
      if (spotData) {
        let newSpot: Spot.Class = new Spot.Class(doc.id, spotData);
        newSpots.push(newSpot);
      } else {
        console.error("Spot could not be cast to Spot.Schema!");
      }
    });

    return newSpots;
  }

  /**
   * Create a new spot and return its ID.
   * @param spotData Spot data to add to this new spot
   * @returns the ID of the new spot
   */
  createSpot(spotData: Spot.Schema): Promise<string> {
    return addDoc(collection(this.firestore, "spots"), spotData).then(
      (data) => {
        return data.id;
      }
    );
  }

  setSpot(spotId: string, spotData: Spot.Schema): Promise<void> {
    console.debug("Setting spot", spotId, JSON.stringify(spotData));
    console.debug("Spot data", spotData);

    try {
      return setDoc(doc(this.firestore, "spots", spotId), spotData);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  updateSpot(
    spotId: string,
    spotUpdateData: Partial<Spot.Schema>
  ): Promise<void> {
    return updateDoc(doc(this.firestore, "spots", spotId), spotUpdateData);
  }

  createMultipleSpots(spotData: Spot.Schema[]): Promise<void> {
    const batch = writeBatch(this.firestore);

    spotData.forEach((spot) => {
      const newSpotRef = doc(collection(this.firestore, "spots"));
      console.log(newSpotRef);
      console.log(spot);
      batch.set(newSpotRef, spot);
    });

    return batch.commit();
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

    console.debug("Adding user", userId, schema);

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

  // Reports //////////////////////////////////////////////////////////////////
  getSpotReportByReportId(reportId: string): Promise<SpotReport> {
    return getDoc(doc(this.firestore, "spot_reports", reportId)).then(
      (snap) => {
        if (!snap.exists()) {
          return Promise.reject("No report found for this report id.");
        }
        return snap.data() as SpotReport;
      }
    );
    return Promise.reject("Not implemented yet.");
  }

  getSpotReportsBySpotId(spotId: string): Promise<SpotReport[]> {
    return getDocs(
      query(
        collection(this.firestore, "spot_reports"),
        where("spot.id", "==", spotId)
      )
    ).then((snap) => {
      if (snap.size == 0) {
        return [];
      }
      return snap.docs.map((data) => data.data() as SpotReport);
    });
  }

  getSpotReportsByUserId(userId: string): Promise<SpotReport> {
    return getDocs(
      query(
        collection(this.firestore, "spot_reports"),
        where("userId", "==", userId)
      )
    ).then((snap) => {
      if (snap.size == 0) {
        return Promise.reject("No reports found for this user id.");
      }
      return snap.docs[0].data() as SpotReport;
    });
  }

  addSpotReport(report: SpotReport) {
    return addDoc(collection(this.firestore, "spot_reports"), report);
  }
}
