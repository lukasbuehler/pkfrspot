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
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInput, MatInputModule } from "@angular/material/input";

@Component({
    selector: "app-spot-review-dialog",
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
        MatFormFieldModule,
        MatFormField,
        MatInputModule,
        MatInput,
        FormsModule,
    ],
    templateUrl: "./spot-review-dialog.component.html",
    styleUrl: "./spot-review-dialog.component.scss"
})
export class SpotReviewDialogComponent {
  hoverRating: number = 0;
  isHovering: boolean = false;
  review: SpotReview;
  isUpdate: boolean;

  constructor(
    public dialogref: MatDialogRef<SpotReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { review: SpotReview; isUpdate: boolean },
    private _spotReviewsService: SpotReviewsService
  ) {
    this.review = data.review;
    this.isUpdate = data.isUpdate;
    this.hoverRating = this.review.rating;
  }

  onNoClick(): void {
    this.dialogref.close();
  }

  submitReview() {
    this._spotReviewsService
      .updateSpotReview(this.review)
      .then(() => {
        // this.dialogref.close();
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
