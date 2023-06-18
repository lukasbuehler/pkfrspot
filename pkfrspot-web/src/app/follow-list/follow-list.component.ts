import { Component, Inject, OnInit, Pipe, PipeTransform } from "@angular/core";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from "@angular/material/legacy-dialog";
import { User } from "src/scripts/db/User";

import * as moment from "moment";
import { DatabaseService } from "../database.service";
import { Observable } from "rxjs";

export interface FollowListDialogData {
  userId: string;
  type: "followers" | "following";
  followUsers: User.FollowingDataSchema[];
  allLoaded: boolean;
}

@Pipe({
  name: "followDuration",
  pure: true, // a pipe is pure by default, this could be omitted
})
export class FollowDurationPipe implements PipeTransform {
  transform(
    timestamp: firebase.default.firestore.Timestamp,
    args?: any
  ): string {
    const millis = timestamp.toMillis();
    return `${moment(millis).fromNow(true)} (since ${moment(millis).format(
      "l LT"
    )})`;
  }
}

@Component({
  selector: "app-follow-list",
  templateUrl: "./follow-list.component.html",
  styleUrls: ["./follow-list.component.scss"],
})
export class FollowListComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FollowListDialogData,
    private _databaseService: DatabaseService
  ) {}

  displayedColumns: string[] = ["user", "duration", "open"];

  isLoading: boolean = false;
  hasLoadedAll: boolean = false;
  lastLoadedFollowing: firebase.default.firestore.Timestamp = null;

  ngOnInit(): void {
    this._loadFollowing();
  }

  loadMoreFollowing() {
    this._loadFollowing();
  }

  private _loadFollowing() {
    this.isLoading = true;
    const chunkSize = 20;

    let obs: Observable<User.FollowingDataSchema[]>;
    if (this.data.type === "followers") {
      obs = this._databaseService.getFollowersOfUser(
        this.data.userId,
        chunkSize
      );
    } else {
      obs = this._databaseService.getFollowingsOfUser(
        this.data.userId,
        chunkSize
      );
    }

    obs.subscribe(
      (followings) => {
        this.isLoading = false;
        this.data.followUsers = this.data.followUsers.concat(followings);

        if (followings.length < chunkSize) {
          // We are at the end, and have loaded all the things
          console.log("The end!");
          this.lastLoadedFollowing = null;
          this.hasLoadedAll = true;
        } else {
          // this was not the end
          console.log("not the end!");
          this.lastLoadedFollowing =
            followings[followings.length - 1].start_following;
        }
      },
      (err) => {},
      () => {}
    );
  }
}
