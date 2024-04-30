import { Component, HostListener, OnInit } from "@angular/core";
import { Router, RoutesRecognized } from "@angular/router";
import { filter, map } from "rxjs/operators";
import { AuthenticationService } from "./authentication.service";
import { StorageService } from "./storage.service";
import { GlobalVariables } from "src/scripts/global";

declare function plausible(eventName: string, options?: { props: any }): void;

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
    this.enforceAlainMode();
  }

  currentPageName = "";

  hasAds = window["canRunAds"];
  userId: string = "";

  alainMode: boolean = false;

  @HostListener("window:resize", ["$event"])
  onResize(event) {
    this.enforceAlainMode();
  }

  enforceAlainMode() {
    if (window.innerHeight < 700 && window.innerWidth < 768) {
      this.alainMode = true;
    } else {
      this.alainMode = false;
    }
    GlobalVariables.alainMode.next(this.alainMode);
    if (typeof plausible !== "undefined") {
      plausible("pageview", { props: { alainMode: this.alainMode } });
    }
  }

  ngOnInit() {
    this.authService.authState$.subscribe(
      (user) => {
        let isAuthenticated: boolean = false;
        if (user) {
          if (user.uid !== this.userId) {
            this.userId = user.uid; // TODO check whyyy
          }
          isAuthenticated = true;
        }

        if (plausible) {
          plausible("pageview", { props: { authenticated: isAuthenticated } });
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
