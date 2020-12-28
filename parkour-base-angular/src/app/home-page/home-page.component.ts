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
  trendingPosts: Post.Class[] = [];
  loadingPosts: boolean = false;

  isUserSignedIn: boolean = false;

  @ViewChild("updateCollection", { static: true })
  updateCollection: PostCollectionComponent;

  ngOnInit() {
    this._authService.state$.subscribe(
      (user) => {
        if (user) {
          this.isUserSignedIn = true;
        } else {
          this.isUserSignedIn = false;
        }
      },
      (error) => {
        console.error(error);
      }
    );

    this.loadingPosts = true;
    this._dbService.getPostUpdates().subscribe(
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
        this.loadingPosts = false;
      },
      (error) => {
        this.loadingPosts = false;
        console.error(error);
      },
      () => {
        this.loadingPosts = false;
      } // complete
    );
  }

  getMorePosts() {
    // get More posts
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
          null,
          null
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
    mediaType: Post.MediaTypes,
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
      post.spot = {
        name: spot.data.name,
        spot_location: spot.data.location,
        image_src: spot.data.image_src,
        ref: this._dbService.docRef("spots/" + spot.id),
      };
    }

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
  }
}
