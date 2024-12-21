import { Component, Input, OnChanges } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  selector: "app-spot-rating",
  templateUrl: "./spot-rating.component.html",
  styleUrls: ["./spot-rating.component.scss"],
  standalone: true,
  imports: [MatTooltip, MatIcon],
})
export class SpotRatingComponent implements OnChanges {
  @Input() rating1to5: number; // floating point number between 1 and 5
  @Input() showEmptyStars: boolean = true;
  @Input() numReviews: number = 0; // integer number of reviews
  @Input() showNumReviews: boolean = false;
  @Input() isCompact: boolean = false;

  constructor() {}

  rating1to5rounded: number = 0;
  rating1to10rounded: number = 0;
  numFullStars: number = 0;
  showHalfStar: boolean = false;
  numEmptyStars: number = 0;

  ngOnChanges() {
    // clamp rating to 1-5
    this.rating1to5 = Math.min(5, Math.max(1, this.rating1to5));
    this.rating1to5rounded = Math.round(this.rating1to5 * 10) / 10;
    this.rating1to10rounded = Math.round(this.rating1to5 * 20) / 10;

    this.numFullStars = Math.floor(Math.round(this.rating1to5 * 2) / 2);
    this.showHalfStar = (Math.round(this.rating1to5 * 2) / 2) % 1 !== 0;
    this.numEmptyStars = 5 - this.numFullStars - (this.showHalfStar ? 1 : 0);
  }
}
