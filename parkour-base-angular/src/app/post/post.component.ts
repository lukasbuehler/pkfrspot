import { Component, OnInit, Input } from "@angular/core";
import * as moment from "moment";
import { Post } from "src/scripts/db/Post";

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
  likedByUser: boolean;

  constructor() {}

  ngOnInit() {
    this.dateAndTimeString = this.getDateAndTimeString();
    this.timeAgoString = this.getTimeAgoString();
  }

  getTimeAgoString(): string {
    return moment(this.post.timePosted).fromNow();
  }

  getDateAndTimeString(): string {
    return moment(this.post.timePosted).format("lll");
  }

  likeButtonPress() {
    if (this.likedByUser) {
      // The post is liked => unlike
      this.likedByUser = false;
      this.post.likes--; // TODO Upadte the post
    } else {
      // The post is not liked => like
      this.likedByUser = true;
      this.post.likes++; // TODO Update the post
    }
  }
}
