import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import * as moment from "moment";
import { Post } from "src/scripts/db/Post";
import { DatabaseService } from "../database.service";
import { AuthenticationService } from "../authentication.service";
import * as firebase from "firebase/app";
import { PlyrComponent } from "ngx-plyr";
import { MapHelper } from "../../scripts/map_helper";
import { ResizedEvent } from "angular-resize-event";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

@Component({
  selector: "app-post",
  templateUrl: "./post.component.html",
  styleUrls: ["./post.component.scss"],
})
export class PostComponent implements OnInit {
  @Input() post: Post.Class;
  @Input() showCard: boolean = true;

  @ViewChild("matCardMedia") matCardMedia: ElementRef;
  @ViewChild(PlyrComponent) plyr: PlyrComponent;

  dateAndTimeString: string;
  timeAgoString: string;
  likedByUser: boolean = null;

  maxHeightToWidthRatio: number = 0;

  constructor(
    private _databaseService: DatabaseService,
    private _authenticationService: AuthenticationService,
    private _snackbar: MatSnackBar,
    private _router: Router
  ) {}

  get currentlyAuthenticatedUserId() {
    return this._authenticationService.uid;
  }

  ngOnInit() {
    this.dateAndTimeString = this.getDateAndTimeString();
    this.timeAgoString = this.getTimeAgoString();

    this.likedByUser = false;

    // Check if posts are liked by the user if a user is authenticated, every time the uid changes

    this._authenticationService.uid$.subscribe(
      (uid) => {
        console.log("Auth state changed");
        if (uid) {
          this._databaseService
            .userHasLikedPost(this.post.id, uid)
            .then((bool) => {
              this.likedByUser = bool;
            })
            .catch((err) => {
              console.error(err);
            });
        } else {
          this.likedByUser = false;
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }

  onResized(event: ResizedEvent) {
    this.updateMediaHeight(event.newWidth, event.newHeight);
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
          // show the like
          this.likedByUser = true;
          this.post.like();

          // save the like
          this._databaseService.addLike(
            this.post.id,
            this._authenticationService.uid,
            {
              time: firebase.default.firestore.Timestamp.now(),
              user: {
                uid: this._authenticationService.uid,
              },
            }
          );
        } else {
          // show the unlike
          this.likedByUser = false;
          this.post.unlike();

          // save the unlike
          this._databaseService.removeLike(
            this.post.id,
            this._authenticationService.uid
          );
        }
      }
    } else {
      // TODO show that you need to sign in
      this._snackbar
        .open("Please sign in to like this post!", "Sign in", {
          duration: 5000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        })
        .onAction()
        .subscribe(() => {
          this._router.navigateByUrl("/sign-in");
        });
    }
  }

  getLocationDisplayCoordinates(coords: google.maps.LatLngLiteral) {
    if (coords) {
      return MapHelper.getDisplayCoordinates(coords);
    }
    return "";
  }

  updateMediaHeight(width, height) {
    if (height / width > this.maxHeightToWidthRatio) {
      this.maxHeightToWidthRatio = height / width;
    }

    if (this.maxHeightToWidthRatio > 1 && height / width !== 1) {
      this.matCardMedia.nativeElement.style.height = width + "px";
    }
  }
}
