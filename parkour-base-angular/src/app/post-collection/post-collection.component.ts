import { Component, OnInit, Input } from '@angular/core';
import * as moment from "moment"

@Component({
  selector: 'app-post-collection',
  templateUrl: './post-collection.component.html',
  styleUrls: ['./post-collection.component.scss']
})
export class PostCollectionComponent implements OnInit {

  @Input() posts: any[];

  constructor() { }

  ngOnInit() {
  }

  // this gets called to often...
  getPostTime(post: any)
  {
    return moment.duration(post.time_posted.seconds, "seconds").subtract((new Date()).getTime(), "milliseconds").humanize(true);
  }

  likeButtonPress(post: any)
  {
    if(post.liked_by_user) {
      // The post is liked => unlike
      post.liked_by_user = false;
      post.likes--;
    }  
    else
    {
      // The post is not liked => like
      post.liked_by_user = true;
      post.likes++;
    }
  }

}
