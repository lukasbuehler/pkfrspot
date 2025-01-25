import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from "@angular/core";
import { Spot, SpotPreviewData } from "../../scripts/db/Spot.js";
import { SpotPreviewCardComponent } from "../spot-preview-card/spot-preview-card.component";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-spot-list",
    imports: [
        SpotPreviewCardComponent,
        MatButtonToggleModule,
        MatIconModule,
        RouterLink,
    ],
    templateUrl: "./spot-list.component.html",
    styleUrl: "./spot-list.component.scss"
})
export class SpotListComponent implements OnChanges {
  @Input() highlightedSpots: SpotPreviewData[] = [];
  @Input() spots: Spot.Class[];

  // all spots minus the highlighted spots, set manually in ngOnChanges
  remainingSpots: Spot.Class[] = [];

  // @Output() clickSpot: EventEmitter<Spot.Class> =
  //   new EventEmitter<Spot.Class>();

  ngOnChanges() {
    this.filterOutHighlightedSpotsFromOtherSpots();
  }

  filterOutHighlightedSpotsFromOtherSpots() {
    this.remainingSpots = this.spots.filter((spot) => {
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
}
