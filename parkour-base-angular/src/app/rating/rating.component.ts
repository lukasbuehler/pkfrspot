import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "app-rating",
  templateUrl: "./rating.component.html",
  styleUrls: ["./rating.component.scss"],
})
export class RatingComponent implements OnInit {
  @Input() rating: number; // number between 1 and 10
  @Input() color: string;

  constructor() {}

  ratingFullStars: number = 0;
  ratingHalfStar: boolean = false;
  ratingEmptyStars: number = 0;

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
