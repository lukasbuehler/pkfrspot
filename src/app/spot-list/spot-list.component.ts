import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Spot, SpotPreviewData } from "../../scripts/db/Spot.js";
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
  @Input() highlightedSpots: SpotPreviewData[] = [];
  @Input() set spots(spots: Spot.Class[]) {
    this.remainingSpots = spots.filter((spot) => {
      const foundSpot: SpotPreviewData | undefined = this.highlightedSpots.find(
        (highlightedSpot) => {
          return highlightedSpot.id === spot.id;
        }
      );
      // if the spot is found in the highlights array,
      // then we want to exclude it from the remaining spots
      // meaning we want to return true if a spot is not found for it be not filtered out
      return !foundSpot;
    });
  }

  remainingSpots: Spot.Class[] = [];

  @Output() clickSpot: EventEmitter<Spot.Class> =
    new EventEmitter<Spot.Class>();
}
