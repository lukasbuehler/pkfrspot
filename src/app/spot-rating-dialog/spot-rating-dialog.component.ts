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

@Component({
  selector: "app-spot-rating-dialog",
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
  templateUrl: "./spot-rating-dialog.component.html",
  styleUrl: "./spot-rating-dialog.component.scss",
})
export class SpotRatingDialogComponent {
  hoverRating: number = 0;
  selectedRating: number = 0;

  constructor(
    public dialogref: MatDialogRef<SpotRatingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SpotReview
  ) {}

  onNoClick(): void {
    this.dialogref.close();
  }

  submitReview() {
    // this._dbService.addSpotReview(this.data);
  }
}
