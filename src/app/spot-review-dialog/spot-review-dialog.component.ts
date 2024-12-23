import { Component, Inject } from "@angular/core";
import { SpotReview } from "../../scripts/db/SpotReview";
import {
  MatButtonModule,
  MatButton,
  MatIconButton,
} from "@angular/material/button";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from "@angular/material/dialog";
import { MatIconModule, MatIcon } from "@angular/material/icon";
import { SpotReviewsService } from "../services/firestore-services/spot-reviews.service";

@Component({
  selector: "app-spot-review-dialog",
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatIconModule,
    MatIconButton,
    MatIcon,
    MatButton,
  ],
  templateUrl: "./spot-review-dialog.component.html",
  styleUrl: "./spot-review-dialog.component.scss",
})
export class SpotReviewDialogComponent {
  hoverRating: number = 0;
  selectedRating: number = 0;

  constructor(
    public dialogref: MatDialogRef<SpotReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SpotReview,
    private _spotReviewsService: SpotReviewsService
  ) {}

  onNoClick(): void {
    this.dialogref.close();
  }

  submitReview() {
    this._spotReviewsService.addSpotReview(this.data);
  }
}
