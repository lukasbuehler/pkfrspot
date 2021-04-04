import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute } from "@angular/router";
import { Post } from "src/scripts/db/Post";
import { User } from "src/scripts/db/User";
import { AuthenticationService } from "../authentication.service";
import { DatabaseService } from "../database.service";
import { FollowListComponent } from "../follow-list/follow-list.component";

@Component({
  selector: "app-profile-page",
  templateUrl: "./profile-page.component.html",
  styleUrls: ["./profile-page.component.scss"],
})
export class ProfilePageComponent implements OnInit {
  userId: string = "";
  user: User.Class = null;
  isLoading: boolean = false;

  postsFromUser: Post.Class[] = [];
  postsFromUserLoading: boolean = false;

  constructor(
    public followListDialog: MatDialog,
    private _authService: AuthenticationService,
    private _databaseService: DatabaseService,
    private _route: ActivatedRoute,
    private _snackbar: MatSnackBar
  ) {}

  profilePicture: string = "";
  isMyProfile: boolean = false;
  loadingFollowing: boolean = false;
  isFollowing: boolean = false;

  private dialogConfig: MatDialogConfig = {
    autoFocus: true,
    restoreFocus: true,
    disableClose: false,
    hasBackdrop: true,
    width: "600px",
    maxWidth: "95%",
    maxHeight: "80%",
  };

  private lastLoadedFollowing: firebase.default.firestore.Timestamp;

  ngOnInit(): void {
    this.userId = this._route.snapshot.paramMap.get("userID") || "";
    this.init();

    this._route.paramMap.subscribe((map) => {
      let _userId = map.get("userID");

      if (_userId) {
        this.userId = _userId || "";
        this.init();
      }
    });

    this._authService.authState$.subscribe((user) => {
      if (user) {
        this.isMyProfile = this.userId === user.uid;
      } else {
        this.isMyProfile = false;
        this.isFollowing = false;
      }
    });
  }

  init() {
    // clear info
    this.user = null;
    this.postsFromUser = [];
    this.profilePicture = "";
    this.isFollowing = false;

    if (this.userId) {
      // load stuff
      this.isMyProfile = this.userId === this._authService.uid;
      this.loadProfile(this.userId);
    }
  }

  loadProfile(userId: string) {
    this._databaseService.getUserById(userId).subscribe(
      (user) => {
        this.user = user;
        this.isLoading = false;

        // Load the profile picture of this user
        this.profilePicture = this.user.profilePicture;

        // Load all the posts from this user
        this.loadPostsForUser(userId);

        // Check if this user follows the authenticated user

        let myUserId = this._authService.uid;
        if (myUserId) {
          this.loadingFollowing = true;
          this._databaseService
            .isFollowingUser(myUserId, userId)
            .then((isFollowing) => {
              this.loadingFollowing = false;
              this.isFollowing = isFollowing;
            })
            .catch((err) => {
              this.loadingFollowing = false;
              console.error(
                "There was an error checking if you follow this user"
              );
              console.error(err);
            });
        }

        // Load the groups of this user
        // TODO
      },
      (err) => {
        console.error(err);
        this.isLoading = false;
      }
    );
    this.isLoading = true;
  }

  loadPostsForUser(userId: string) {
    this._databaseService.getPostsFromUser(userId).subscribe(
      (postMap) => {
        for (let postId in postMap) {
          let docIndex = this.postsFromUser.findIndex((post, index, obj) => {
            return post.id === postId;
          });
          if (docIndex >= 0) {
            // the document already exists already in this array
            this.postsFromUser[docIndex].updateData(postMap[postId]);
          } else {
            // create and add new Post
            this.postsFromUser.push(new Post.Class(postId, postMap[postId]));
            this.postsFromUser.sort((a, b) => {
              return b.timePosted.getTime() - a.timePosted.getTime();
            });
          }
        }
        this.postsFromUserLoading = false;
      },
      (err) => {
        console.error(err);
        this.postsFromUserLoading = false;
      }
    );
    this.postsFromUserLoading = true;
  }

  followButtonClick() {
    this.loadingFollowing = true;

    if (this.user && !this.isMyProfile) {
      if (this.isFollowing) {
        // Already following this user, unfollow
        this._databaseService
          .unfollowUser(this._authService.uid, this.userId)
          .then(() => {
            this.isFollowing = false;
            this.loadingFollowing = false;
          })
          .catch((err) => {
            this.loadingFollowing = false;
            this._snackbar.open(
              "There was an error unfollowing the user!",
              "OK",
              {
                verticalPosition: "bottom",
                horizontalPosition: "center",
              }
            );
          });
      } else {
        // Not following this user, follow
        this._databaseService
          .followUser(
            this._authService.uid,
            this._authService.user.data,
            this.userId,
            this.user.data
          )
          .then(() => {
            this.isFollowing = true;
            this.loadingFollowing = false;
          })
          .catch((err) => {
            console.error(err);
            this.loadingFollowing = false;
            this._snackbar.open(
              "There was an error following the user!",
              "OK",
              {
                verticalPosition: "bottom",
                horizontalPosition: "center",
              }
            );
          });
      }
    }
  }

  viewFollowers() {
    if (this.isMyProfile) {
      const followDialogRef = this.followListDialog.open(FollowListComponent, {
        ...this.dialogConfig,
        data: {
          userId: this.userId,
          type: "followers",
          followUsers: [],
        },
      });
    }
  }

  viewFollowing() {
    if (this.isMyProfile) {
      const followDialogRef = this.followListDialog.open(FollowListComponent, {
        ...this.dialogConfig,
        data: {
          userId: this.userId,
          type: "following",
          followUsers: [],
        },
      });
    }
  }
}
