import { Component, OnInit, Input } from '@angular/core';
import * as moment from "moment"

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {

  @Input() post: any = {};
  @Input() showCard: boolean = true;

  dateAndTimeString: string;
  timeAgoString: string;

  constructor() { }

  ngOnInit() {
    this.dateAndTimeString = this.getDateAndTimeString();
    this.timeAgoString = this.getTimeAgoString();
  } 

  getTimeAgoString(): string
  {
    return moment.duration(this.post.time_posted.seconds, "seconds").subtract((new Date()).getTime(), "milliseconds").humanize(true);
  }

  getDateAndTimeString(): string
  {
    return moment.unix(this.post.time_posted.seconds).format("lll");
  }

  likeButtonPress()
  {
    if (this.post.liked_by_user)
    {
      // The post is liked => unlike
      this.post.liked_by_user = false;
      this.post.likes--;
    }
    else
    {
      // The post is not liked => like
      this.post.liked_by_user = true;
      this.post.likes++;
    }
  }
}
