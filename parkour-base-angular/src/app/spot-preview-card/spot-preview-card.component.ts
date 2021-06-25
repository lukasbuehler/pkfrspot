import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Spot } from "src/scripts/db/Spot";

@Component({
  selector: "app-spot-preview-card",
  templateUrl: "./spot-preview-card.component.html",
  styleUrls: ["./spot-preview-card.component.scss"],
})
export class SpotPreviewCardComponent implements OnInit {
  @Input() spot: Spot.Class;
  @Input() infoOnly: boolean = false;
  @Input() clickable: boolean = false;

  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}
  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }
}
