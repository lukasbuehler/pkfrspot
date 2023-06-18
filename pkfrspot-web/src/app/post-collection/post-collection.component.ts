import { Component, OnInit, Input, HostBinding } from "@angular/core";
import {
  animate,
  animateChild,
  query,
  sequence,
  stagger,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";

import { Post } from "src/scripts/db/Post";

@Component({
  selector: "app-post-collection",
  templateUrl: "./post-collection.component.html",
  styleUrls: ["./post-collection.component.scss"],
  animations: [
    trigger("postCollectionAnimation", [
      transition("* => *", [
        query("@animate", [stagger(-500, animateChild())], { optional: true }),
      ]),
    ]),
    trigger("postAnimation", [
      transition(":enter", [
        style({ opacity: 0, height: "0px", transform: "translateY(-300px)" }),
        sequence([
          animate("0.3s ease", style({ height: "*" })),
          animate("0.5s ease", style({ opacity: 1, transform: "none" })),
        ]),
      ]),
      transition(":leave", [
        sequence([
          animate("0.5s ease", style({ opacity: 0, transform: "scale(0.8)" })),
          animate("0.3s ease", style({ height: "0px" })),
        ]),
      ]),
    ]),
  ],
})
export class PostCollectionComponent implements OnInit {
  @Input() posts: Post.Class[];
  @Input() title: string;
  @Input() loading: boolean = false;

  constructor() {}

  ngOnInit() {}
}
