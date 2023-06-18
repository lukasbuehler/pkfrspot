import { Component } from "@angular/core";
import { AuthenticationService } from "../authentication.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-user-menu-content",
  templateUrl: "./user-menu-content.component.html",
  styleUrls: ["./user-menu-content.component.scss"],
})
export class UserMenuContentComponent {
  constructor(
    public authService: AuthenticationService,
    private _snackbar: MatSnackBar
  ) {}

  logUserOut() {
    this.authService
      .logUserOut()
      .then(() => {
        // Successfully logged out
        this._snackbar.open("You were successfully signed out!", "OK", {
          duration: 2000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
      })
      .catch((err) => {
        // There was an error logging out.
        this._snackbar.open(
          "Error, there was a problem signing out!",
          "Dismiss",
          {
            duration: 5000,
            horizontalPosition: "center",
            verticalPosition: "bottom",
          }
        );
      });
  }
}
