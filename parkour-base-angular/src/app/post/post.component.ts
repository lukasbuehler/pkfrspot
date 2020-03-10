import { Component, OnInit, Input } from "@angular/core";
import * as moment from "moment";
import { Post } from "src/scripts/db/Post";
import { DatabaseService } from "../database.service";
import { AuthenticationService } from "../authentication.service";
import * as firebase from "firebase/app";

@Component({
  selector: "app-post",
  templateUrl: "./post.component.html",
  styleUrls: ["./post.component.scss"]
})
export class PostComponent implements OnInit {
  @Input() post: Post.Class;
  @Input() showCard: boolean = true;

  dateAndTimeString: string;
  timeAgoString: string;
  likedByUser: boolean = null;

  constructor(
    private _databaseService: DatabaseService,
    private _authenticationService: AuthenticationService
  ) {}

  ngOnInit() {
    this.dateAndTimeString = this.getDateAndTimeString();
    this.timeAgoString = this.getTimeAgoString();

    this.likedByUser = false; // TODO Temp
  }

  getTimeAgoString(): string {
    return moment(this.post.timePosted).fromNow();
  }

  getDateAndTimeString(): string {
    return moment(this.post.timePosted).format("lll");
  }

  likeButtonPress() {
    if (this._authenticationService.isSignedIn()) {
      if (this.likedByUser !== null) {
        if (!this.likedByUser) {
          this.likedByUser = true;
          this._databaseService.addLike(
            this.post.id,
            this._authenticationService.uid,
            {
              time: firebase.firestore.Timestamp.now(),
              user: {
                uid: this._authenticationService.uid
              }
            }
          );
        } else {
          this.likedByUser = false;
        }
      }
    } else {
      // TODO show that you need to sign in
    }
  }
}
