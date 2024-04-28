import { Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { SpotReport } from "src/scripts/db/SpotReport";

@Component({
  selector: "app-spot-report-dialog",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  templateUrl: "./spot-report-dialog.component.html",
  styleUrl: "./spot-report-dialog.component.scss",
})
export class SpotReportDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SpotReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SpotReport
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
