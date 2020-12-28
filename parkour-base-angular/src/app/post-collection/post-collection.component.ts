import { Component, OnInit, Input } from "@angular/core";
import { Post } from "src/scripts/db/Post";

@Component({
  selector: "app-post-collection",
  templateUrl: "./post-collection.component.html",
  styleUrls: ["./post-collection.component.scss"],
})
export class PostCollectionComponent implements OnInit {
  @Input() posts: Post.Class[];
  @Input() title: string;
  @Input() loading: boolean;

  constructor() {}

  ngOnInit() {}
}
