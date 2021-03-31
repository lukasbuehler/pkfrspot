import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Post } from "src/scripts/db/Post";
import { User } from "src/scripts/db/User";
import { AuthenticationService } from "../authentication.service";
import { DatabaseService } from "../database.service";

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
    private _authService: AuthenticationService,
    private _databaseService: DatabaseService,
    private _route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = this._route.snapshot.paramMap.get("userID") || "";
    this.init();

    this._route.paramMap.subscribe((map) => {
      console.log("Map updated");
      let _userId = map.get("userID");
      console.log(_userId);

      if (_userId) {
        this.userId = _userId || "";
        this.init();
      }
    });
  }

  init() {
    console.log("init");
    if (this.userId) {
      // clear info
      this.user = null;
      this.postsFromUser = [];

      // load stuff
      this.loadProfile(this.userId);
    }
  }

  get profilePicture() {
    return this.user.profilePicture;
  }

  get isMyProfile() {
    return this.userId === this._authService.uid;
  }

  get isFollowing() {
    // TODO
    return null;
  }

  loadProfile(userId: string) {
    this._databaseService.getUserById(userId).subscribe(
      (user) => {
        this.user = user;
        console.log(user);
        this.isLoading = false;

        this.loadPostsForUser(userId);
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
}
