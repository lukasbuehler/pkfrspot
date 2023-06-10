import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DatabaseService } from "src/app/database.service";
import { Post } from "src/scripts/db/Post";
import { PostCollectionComponent } from "../post-collection/post-collection.component";
import { MatLegacyDialog as MatDialog } from "@angular/material/legacy-dialog";
import { MatDrawer } from "@angular/material/sidenav";
import { EditPostDialogComponent } from "../edit-post-dialog/edit-post-dialog.component";
import { StorageService } from "../storage.service";
import { AuthenticationService } from "../authentication.service";
import { Spot } from "src/scripts/db/Spot";
import { MediaType } from "src/scripts/db/Interfaces";
import { DocumentChangeType } from "@angular/fire/compat/firestore";
import { Observable, Subscription } from "rxjs";
import { GeoPoint, Timestamp } from "firebase/firestore";

@Component({
  selector: "app-home-page",
  templateUrl: "./home-page.component.html",
  styleUrls: ["./home-page.component.scss"],
})
export class HomePageComponent implements OnInit, OnDestroy {
  constructor(
    public authService: AuthenticationService,
    private _dbService: DatabaseService,
    private _storageService: StorageService,
    public dialog: MatDialog
  ) {}

  private _updatesSubscription: Subscription = null;
  updatePosts: Post.Class[] = [];
  todaysTopPosts: Post.Class[] = [];
  loadingUpdates: boolean = false;
  loadingTodaysTopPosts: boolean = false;

  isUserSignedIn: boolean = false;

  debugCounterNumber = 0;

  ngOnInit() {
    // Load the top posts
    this.getTodaysTopPosts();

    if (this.authService.isSignedIn) {
      this._subscribeToUpdates(this.authService.user.uid);
    }
    this.authService.authState$.subscribe(
      (user) => {
        console.log("User, changed, getting new updates");
        this.updatePosts = [];

        if (user) {
          this._subscribeToUpdates(user.uid);
        } else {
          this._unsubscribeFromUpdates();
        }
      },
      (err) => {
        console.error("Could not get user", err);
      }
    );
  }

  ngOnDestroy() {
    this._unsubscribeFromUpdates();
  }

  getMorePosts() {
    // get More posts
  }

  private _unsubscribeFromUpdates() {
    console.log("unsubscribing from post updates");
    if (this._updatesSubscription && !this._updatesSubscription.closed) {
      this._updatesSubscription.unsubscribe();
      this._updatesSubscription = null;
    }
  }

  private _subscribeToUpdates(userId: string) {
    if (userId) {
      this.loadingUpdates = true;

      if (this._updatesSubscription && !this._updatesSubscription.closed) {
        // The subscription is still open, but we are requesting a new one.
        console.warn(
          "There is already an open subscription to user updates but a new one was requested. Closing and opening a new one..."
        );
        this._unsubscribeFromUpdates();
      }

      this._updatesSubscription = this._dbService
        .getPostUpdates(userId)
        .subscribe(
          (changes: { type: DocumentChangeType; post: Post.Class }[]) => {
            this.loadingUpdates = false;
            changes.forEach((change) => {
              const index2 = this.updatePosts.findIndex((post, index, obj) => {
                return post.id === change.post.id;
              });
              if (index2 >= 0) {
                // the document already exists already in this array
                this.updatePosts[index2].updateData(change.post.getData());
              } else {
                // create and add new Post
                this.updatePosts.push(change.post);

                // sort
                this.updatePosts.sort((a, b) => {
                  return b.timePosted.getTime() - a.timePosted.getTime();
                });
              }
            });
          },
          (error) => {
            this.loadingUpdates = false;
            console.error("Error loading updates");
            console.error(error);
          },
          () => {
            this.loadingUpdates = false;
            console.log("Post loading complete");
          } // complete
        );
    } else {
      console.warn("Error subscribing to updates. User ID is invalid");
    }
  }

  getTodaysTopPosts() {
    this.loadingTodaysTopPosts = true;
    this._dbService.getTodaysTopPosts().subscribe(
      (postMap) => {
        for (let postId in postMap) {
          let docIndex = this.todaysTopPosts.findIndex((post, index, obj) => {
            return post.id === postId;
          });
          if (docIndex >= 0) {
            // the document already exists already in this array
            this.todaysTopPosts[docIndex].updateData(postMap[postId]);
          } else {
            // create and add new Post
            this.todaysTopPosts.push(new Post.Class(postId, postMap[postId]));

            // sort
            this.todaysTopPosts.sort((a, b) => {
              return (
                b.likeCount - a.likeCount ||
                b.timePosted.getTime() - a.timePosted.getTime()
              );
            });
          }
        }
        this.loadingTodaysTopPosts = false;
      },
      (error) => {
        this.loadingTodaysTopPosts = false;
        console.error(error);
      },
      () => {
        this.loadingTodaysTopPosts = false;
      } // complete
    );
  }

  createPost() {
    const createPostDialog = this.dialog.open(EditPostDialogComponent, {
      width: "600px",
      data: { isCreating: true },
    });

    createPostDialog.afterClosed().subscribe(
      (result) => {
        this.saveNewPost(
          result.title,
          result.body,
          result.mediaType,
          result.location,
          result.spot
        );
      },
      (error) => {
        console.error(error);
      }
    );
  }

  saveNewPost(
    title: string,
    body: string,
    mediaType: MediaType | null,
    location: google.maps.LatLngLiteral | null,
    spot: Spot.Class | null
  ) {
    let post: Post.Schema = {
      title: title,
      body: body,
      time_posted: Timestamp.now(),
      user: {
        uid: this.authService.user.uid,
        display_name: this.authService.user.data.displayName,
        ref: this._dbService.docRef("users/" + this.authService.user.uid),
      },
    };

    if (location) {
      post.location = new GeoPoint(location.lat, location.lng);
    }

    if (spot) {
      const lat = spot.location.lat;
      const lng = spot.location.lng;
      post.spot = {
        name: spot.name || "",
        spot_location: new GeoPoint(lat, lng),
        image_src: spot.media && spot.media[0]?.src ? spot.media[0].src : "",
        ref: this._dbService.docRef("spots/" + spot.id),
      };
    }

    if (mediaType) {
      this._storageService.upload().subscribe(
        (src) => {
          // now create the DB entry for the post
          (post.media = {
            type: mediaType,
            src: src,
          }),
            this._dbService.addPost(post);
        },
        (error) => {
          console.error(error);
        }
      );
    } else {
      this._dbService.addPost(post);
    }
  }
}
