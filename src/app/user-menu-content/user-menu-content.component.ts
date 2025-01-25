import { Component } from "@angular/core";
import { AuthenticationService } from "../services/authentication.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatIcon } from "@angular/material/icon";
import { MatMenuItem } from "@angular/material/menu";
import { RouterLink } from "@angular/router";
import { NgIf } from "@angular/common";

@Component({
    selector: "app-user-menu-content",
    templateUrl: "./user-menu-content.component.html",
    styleUrls: ["./user-menu-content.component.scss"],
    imports: [NgIf, RouterLink, MatMenuItem, MatIcon]
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
