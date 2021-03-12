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

  addLike(postId: string, userUID: string, newLike: Like.Schema) {
    if (userUID !== newLike.user.uid) {
      console.error("Schema user UID and given UID don't match!");
      return;
    }

    this.db
      .collection<Like.Schema>(`posts/${postId}/likes`)
      .doc(userUID)
      .set(newLike)
      .then(() => {
        console.log("Added like on " + postId + " for " + userUID);
      })
      .catch((error) => {
        console.error("Couldn't add like.", error);
      });
  }

  removeLike(postId: string, userUID: string) {
    this.db
      .collection<Like.Schema>(`posts/${postId}/likes`)
      .doc(userUID)
      .delete()
      .then(() => {
        console.log("Your like was removed successfully");
      })
      .catch((error) => {
        console.error("Couldn't remove your like");
        console.error(error);
        console.log("Called with: ", postId, userUID);
      });
  }

  getPostUpdates(): Observable<any> {
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

  createSpot(spot: Spot.Class): Observable<any> {
    return new Observable<any>((observer) => {
      this.db
        .collection<Spot.Schema>("spots")
        .add(spot.data)
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

  setSpot(spot: Spot.Class): Observable<any> {
    return new Observable<any>((observer) => {
      this.db
        .collection<Spot.Schema>("spots")
        .doc(spot.id)
        .set(spot.data)
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

  addUser(userId, display_name): Promise<User.Schema> {
    return new Promise<User.Schema>((resolve, reject) => {
      this.db.collection("users").doc(userId).set({
        display_name: display_name,
        verified_email: false,
      });
    });
  }
}
