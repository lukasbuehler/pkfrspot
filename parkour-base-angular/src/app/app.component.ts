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
  wasSignedIn = false;

  ngOnInit() {
    this.authService.state$.subscribe(
      (user) => {
        if (user) {
          this.wasSignedIn = true;
          this._snackbar.open(`Welcome ${user.displayName}!`, "", {
            duration: 2000,
            horizontalPosition: "center",
            verticalPosition: "bottom",
          });
        } else {
          if (this.wasSignedIn) {
            this._snackbar.open("You have been signed out!", "", {
              duration: 2000,
              horizontalPosition: "center",
              verticalPosition: "bottom",
            });
          }
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
      text: "The PKFR Spot",
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
}
