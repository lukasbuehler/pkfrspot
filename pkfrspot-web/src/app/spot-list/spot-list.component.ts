import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Spot } from "../../scripts/db/Spot.js";
import { SpotPreviewCardComponent } from "../spot-preview-card/spot-preview-card.component";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-spot-list",
  standalone: true,
  imports: [SpotPreviewCardComponent, MatButtonToggleModule, MatIconModule],
  templateUrl: "./spot-list.component.html",
  styleUrl: "./spot-list.component.scss",
})
export class SpotListComponent {
  @Input() spots: Spot.Class[] = [];

  @Output() clickSpot: EventEmitter<Spot.Class> =
    new EventEmitter<Spot.Class>();
}
