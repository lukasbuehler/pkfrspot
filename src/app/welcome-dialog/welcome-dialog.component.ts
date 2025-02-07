import { Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from "@angular/material/dialog";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-welcome-dialog",
  imports: [MatDialogModule, MatButtonModule, RouterLink],
  templateUrl: "./welcome-dialog.component.html",
  styleUrl: "./welcome-dialog.component.scss",
})
export class WelcomeDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<WelcomeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { version: string }
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  agreeAndContinue() {
    // store the accepted version of the terms of service in browser local storage
    localStorage.setItem("acceptedVersion", this.data.version);
    this.dialogRef.close();
  }
}
