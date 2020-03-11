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

@Component({
  selector: "app-home-page",
  templateUrl: "./home-page.component.html",
  styleUrls: ["./home-page.component.scss"]
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

  isUserSignedIn: boolean = false;

  @ViewChild("updateCollection", { static: true })
  updateCollection: PostCollectionComponent;

  @ViewChild("followingDrawer", { static: true }) followingDrawer: MatDrawer;

  ngOnInit() {
    this._authService.state$.subscribe(
      user => {
        if (user) {
          this.isUserSignedIn = true;
        } else {
          this.isUserSignedIn = false;
        }
      },
      error => {
        console.error(error);
      }
    );

    this._dbService.getPostUpdates().subscribe(
      postMap => {
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
      },
      error => {
        console.error(error);
      },
      () => {} // complete
    );
  }

  getMorePosts() {
    // get More posts
  }

  scrolledDown() {
    this.getMorePosts();
  }

  createPost() {
    const createPostDialog = this.dialog.open(EditPostDialogComponent, {
      width: "600px",
      data: { isCreating: true }
    });

    createPostDialog.afterClosed().subscribe(
      result => {
        this.saveNewPost(result.title, result.body, result.is_image);
      },
      error => {
        console.error(error);
      }
    );
  }

  saveNewPost(title: string, body: string, isImage: boolean) {
    this._storageService.upload().subscribe(
      src => {
        // now create the DB entry for the post
        this._dbService.addPost({
          title: title,
          body: body,
          media: {
            is_image: isImage,
            src: src
          },
          time_posted: firebase.firestore.Timestamp.now(),
          user: {
            uid: this._authService.uid,
            display_name: this._authService.user.displayName,
            ref: this._dbService.docRef("users/" + this._authService.uid)
          }
        });
      },
      error => {
        console.error(error);
      }
    );
  }
}
