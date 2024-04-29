import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Spot } from "src/scripts/db/Spot.js";
import { SpotPreviewCardComponent } from "../spot-preview-card/spot-preview-card.component";

@Component({
  selector: "app-spot-list",
  standalone: true,
  imports: [SpotPreviewCardComponent],
  templateUrl: "./spot-list.component.html",
  styleUrl: "./spot-list.component.scss",
})
export class SpotListComponent {
  @Input() spots: Spot.Class[] = [];

  @Output() clickSpot: EventEmitter<Spot.Class> =
    new EventEmitter<Spot.Class>();
}
