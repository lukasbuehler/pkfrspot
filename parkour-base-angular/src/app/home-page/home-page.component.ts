import { Component, OnInit, ViewChild } from "@angular/core";
import { DatabaseService } from "src/app/database.service";
import { Post } from "src/scripts/db/Post";
import { PostCollectionComponent } from "../post-collection/post-collection.component";
import { MatDrawer, MatDialog } from "@angular/material";
import { EditPostDialogComponent } from "../edit-post-dialog/edit-post-dialog.component";
import { StorageService } from "../storage.service";
import * as firebase from "firebase/app";

@Component({
  selector: "app-home-page",
  templateUrl: "./home-page.component.html",
  styleUrls: ["./home-page.component.scss"]
})
export class HomePageComponent implements OnInit {
  constructor(
    private _dbService: DatabaseService,
    public dialog: MatDialog,
    private _storageService: StorageService
  ) {}

  updatePosts: Post.Class[] = [];
  trendingPosts: Post.Class[] = [];

  @ViewChild("updateCollection") updateCollection: PostCollectionComponent;

  @ViewChild("followingDrawer") followingDrawer: MatDrawer;
  @ViewChild("suggestionsDrawer") suggestionsDrawer: MatDrawer;

  ngOnInit() {
    this._dbService.getPostUpdates().subscribe(
      data => {
        this.updatePosts = this.updatePosts.concat(data);
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
        this.saveNewPost(result.title, result.body);
      },
      error => {
        console.error(error);
      }
    );
  }

  saveNewPost(title: string, body: string) {
    this._storageService.upload().subscribe(
      img_src => {
        // now create the DB entry for the post
        this._dbService.addPost({
          title: title,
          body: body,
          image_src: img_src,
          likes: 0,
          time_posted: firebase.firestore.Timestamp.now(),
          user: {
            id: "pAxfc6rwUU9qLhsqj36l",
            name: "Lukas Bühler",
            ref: "users/pAxfc6rwUU9qLhsqj36l"
          }
        });
      },
      error => {
        console.error(error);
      }
    );
  }
}
