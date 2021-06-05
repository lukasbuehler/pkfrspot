import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthenticationService } from "./authentication.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  constructor(
    public authService: AuthenticationService,
    private _snackbar: MatSnackBar
  ) {}

  hasAds = window["canRunAds"];
  userId: string = "";

  ngOnInit() {
    this.authService.authState$.subscribe(
      (user) => {
        if (user) {
          if (user.uid !== this.userId) {
            this._snackbar.open(`Welcome ${user.displayName}!`, "Dismiss", {
              duration: 2000,
              horizontalPosition: "center",
              verticalPosition: "bottom",
            });
            this.userId = user.uid;
          }
        } else {
          // User is not signed in
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }

  navbarConfig = {
    color: "primary",
    logo: {
      text: "PkFr Spot",
      class: "logo",
    },
    buttons: [
      {
        name: "Home",
        link: "/",
        badge: {
          number: 0,
          color: "accent",
        },
        tooltip: "",
      },
      {
        name: "Spot map",
        link: "/map",
        badge: {
          number: 0,
          color: "accent",
        },
        tooltip: "",
      },
      /*{
        name: "Wiki",
        link: "/wiki",
        badge: {
          number: 0,
          color: "accent",
        },
        tooltip: "",
      },*/
      /*{
        name: "Community",
        link: "/community",
        badge: {
          number: 0,
          color: "accent",
        },
        tooltip: "",
      },*/
      {
        name: "About",
        link: "/about",
        badge: {
          number: 0,
          color: "accent",
        },
        tootltip: "",
      },
    ],
  };

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
