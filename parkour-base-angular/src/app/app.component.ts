import { Component, OnInit } from "@angular/core";
import { MatLegacySnackBar as MatSnackBar } from "@angular/material/legacy-snack-bar";
import { Router, RoutesRecognized } from "@angular/router";
import { filter, map } from "rxjs/operators";
import { AuthenticationService } from "./authentication.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  constructor(
    public router: Router,
    public authService: AuthenticationService,
    private _snackbar: MatSnackBar
  ) {
    // initialize google maps
  }

  currentPageName = "";

  hasAds = window["canRunAds"];
  userId: string = "";

  ngOnInit() {
    this.authService.authState$.subscribe(
      (user) => {
        if (user) {
          if (user.uid !== this.userId) {
            /* 
            this._snackbar.open(`Welcome ${user.data.displayName}!`, "Dismiss", {
              duration: 2000,
              horizontalPosition: "center",
              verticalPosition: "bottom",
            });
            */
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

    // get the route name
    this.router.events
      .pipe(filter((event) => event instanceof RoutesRecognized))
      .pipe(
        map((event: RoutesRecognized) => {
          return event.state.root.firstChild.data?.routeName || "";
        })
      )
      .subscribe((routeName) => {
        this.currentPageName = routeName;
      });
  }

  navbarConfig = {
    color: "primary",
    logo: {
      text: "PkFr Spot",
      class: "logo",
    },
    buttons: [
      {
        name: "Posts",
        link: "/",
        icon: "question_answer",
        badge: {
          number: 0,
          color: "accent",
        },
        tooltip: "",
      },
      {
        name: "Spot map",
        link: "/map",
        icon: "map",
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
        icon: "info",
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
