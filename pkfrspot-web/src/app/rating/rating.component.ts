import { Component, OnInit, Input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { NgIf, NgFor } from "@angular/common";

@Component({
    selector: "app-rating",
    templateUrl: "./rating.component.html",
    styleUrls: ["./rating.component.scss"],
    standalone: true,
    imports: [
        NgIf,
        MatTooltip,
        NgFor,
        MatIcon,
    ],
})
export class RatingComponent implements OnInit {
  @Input() rating: number; // number between 1 and 10
  @Input() color: string;

  constructor() {}

  ratingFullStars: number = 0;
  ratingHalfStar: boolean = false;
  ratingEmptyStars: number = 0;

  ratingMeaning = [
    "Not rated", // 0 (0 stars)
    "Horrible", // 1 (0.5 stars)
    "Wack", // 2 (1 star)
    "Pretty bad", // 3 (1.5 stars)
    "Meh", // 4 (2 stars)
    "Alright", // 5 (2.5 stars) - Middle
    "Good", // 6 (3 stars)
    "Great", // 7 (3.5 stars)
    "Amazing", // 8 (4 stars)
    "Unbelieveable", // 9 (4.5 stars)
    "Perfect", // 10 (5 stars)
  ];

  getRatingMeaning(rating: number): string {
    return this.ratingMeaning[Math.min(Math.max(Math.round(rating), 0), 10)];
  }

  makeIndexNumberArray(number: number) {
    return Array(number)
      .fill(0)
      .map((v, i) => i);
  }

  ngOnInit() {
    if (this.rating && this.rating >= 1 && this.rating <= 10) {
      this.rating = Math.round(this.rating * 10) / 10;
      let roundedRating = Math.round(this.rating);
      this.ratingFullStars = Math.floor(roundedRating / 2);
      this.ratingHalfStar = !!(roundedRating % 2);
      this.ratingEmptyStars =
        5 - this.ratingFullStars - Number(this.ratingHalfStar);
    }
  }
}
