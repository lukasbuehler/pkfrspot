import { Component, OnInit, ViewChild } from "@angular/core";
import { DatabaseService } from "src/app/database.service";
import { Post } from "src/scripts/db/Post";
import { PostCollectionComponent } from "../post-collection/post-collection.component";
import { MatDialog } from "@angular/material/dialog";
import { MatDrawer } from "@angular/material/sidenav";
import { EditPostDialogComponent } from "../edit-post-dialog/edit-post-dialog.component";
import { StorageService } from "../storage.service";
import * as firebase from "firebase/app";
import { AuthenticationService } from "../authentication.service";
import { Spot } from "src/scripts/db/Spot";
import { MediaType } from "src/scripts/db/Interfaces";

@Component({
  selector: "app-home-page",
  templateUrl: "./home-page.component.html",
  styleUrls: ["./home-page.component.scss"],
})
export class HomePageComponent implements OnInit {
  constructor(
    private _authService: AuthenticationService,
    private _dbService: DatabaseService,
    private _storageService: StorageService,
    public dialog: MatDialog
  ) {}

  updatePosts: Post.Class[] = [];
  todaysTopPosts: Post.Class[] = [];
  loadingUpdates: boolean = false;
  loadingTodaysTopPosts: boolean = false;

  isUserSignedIn: boolean = false;

  debugCounterNumber = 0;

  @ViewChild("updateCollection", { static: true })
  updateCollection: PostCollectionComponent;

  ngOnInit() {
    this._authService.state$.subscribe(
      (user) => {
        if (user) {
          this.isUserSignedIn = true;
          this.getUpdates();
        } else {
          this.isUserSignedIn = false;
        }
      },
      (error) => {
        console.error(error);
      }
    );

    this.getTodaysTopPosts();
  }

  getMorePosts() {
    // get More posts
  }

  getUpdates() {
    const userId = this._authService.uid;
    if (userId) {
      this.loadingUpdates = true;
      this._dbService.getPostUpdates(userId).subscribe(
        (postMap) => {
          for (let postId in postMap) {
            let docIndex = this.updatePosts.findIndex((post, index, obj) => {
              return post.id === postId;
            });
            if (docIndex >= 0) {
              // the document already exists already in this array
              this.updatePosts[docIndex].updateData(postMap[postId]);
            } else {
              // create and add new Post
              this.updatePosts.push(new Post.Class(postId, postMap[postId]));
              this.updatePosts.sort((a, b) => {
                return b.timePosted.getTime() - a.timePosted.getTime();
              });
            }
          }
          this.loadingUpdates = false;
        },
        (error) => {
          this.loadingUpdates = false;
          console.error(error);
        },
        () => {
          this.loadingUpdates = false;
        } // complete
      );
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
            this.updatePosts[docIndex].updateData(postMap[postId]);
          } else {
            // create and add new Post
            this.todaysTopPosts.push(new Post.Class(postId, postMap[postId]));
            console.log("added post");

            // sort
            /*
            this.todaysTopPosts.sort((a, b) => {
              return (
                b.likeCount - a.likeCount ||
                b.timePosted.getTime() - a.timePosted.getTime()
              );
            });
            */
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
      time_posted: firebase.default.firestore.Timestamp.now(),
      user: {
        uid: this._authService.uid,
        display_name: this._authService.user.displayName,
        ref: this._dbService.docRef("users/" + this._authService.uid),
      },
    };

    if (location) {
      post.location = new firebase.default.firestore.GeoPoint(
        location.lat,
        location.lng
      );
    }

    if (spot) {
      const lat = spot.location.lat;
      const lng = spot.location.lng;
      post.spot = {
        name: spot.name || "",
        spot_location: new firebase.default.firestore.GeoPoint(lat, lng),
        image_src: spot.media[0]?.src || "",
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
