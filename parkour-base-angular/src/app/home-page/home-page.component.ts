import { Component, OnInit, ViewChild } from "@angular/core";
import { DatabaseService } from "src/app/database.service";
import { Post } from "src/scripts/db/Post";
import { PostCollectionComponent } from "../post-collection/post-collection.component";
import { MatDrawer, MatDialog } from "@angular/material";
import { EditPostDialogComponent } from "../edit-post-dialog/edit-post-dialog.component";

@Component({
  selector: "app-home-page",
  templateUrl: "./home-page.component.html",
  styleUrls: ["./home-page.component.scss"]
})
export class HomePageComponent implements OnInit {
  constructor(private _dbService: DatabaseService, public dialog: MatDialog) {}

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
      width: "400px"
    });

    createPostDialog.afterClosed().subscribe(
      result => {
        console.log("was closed");
      },
      error => {
        console.error(error);
      }
    );
  }
}
