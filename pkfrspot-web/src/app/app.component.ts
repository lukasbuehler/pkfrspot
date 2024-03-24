import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router, RoutesRecognized } from "@angular/router";
import { filter, map } from "rxjs/operators";
import { AuthenticationService } from "./authentication.service";
import { environment } from "src/environments/environment";
import { StorageService } from "./storage.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  constructor(
    public router: Router,
    public authService: AuthenticationService,
    public storageService: StorageService
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
      //   {
      //     name: "Posts",
      //     link: "/posts",
      //     icon: "question_answer",
      //     badge: {
      //       number: 0,
      //       color: "accent",
      //     },
      //     tooltip: "",
      //   },
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
}
