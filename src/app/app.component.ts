import { Component, HostListener, OnInit } from "@angular/core";
import {
  Router,
  RoutesRecognized,
  RouterLink,
  RouterOutlet,
} from "@angular/router";
import { filter, map } from "rxjs/operators";
import { AuthenticationService } from "./authentication.service";
import { StorageService } from "./storage.service";
import { GlobalVariables } from "../scripts/global";
import { UserMenuContentComponent } from "./user-menu-content/user-menu-content.component";
import { NgIf, NgOptimizedImage } from "@angular/common";
import { MatFabButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenuTrigger, MatMenu, MatMenuItem } from "@angular/material/menu";
import { MatToolbar } from "@angular/material/toolbar";
import { NavRailContentComponent } from "./nav-rail-content/nav-rail-content.component";
import { Mat3NavButtonComponent } from "./mat3-nav-button/mat3-nav-button.component";
import { NavRailComponent } from "./nav-rail/nav-rail.component";
import { NavRailContainerComponent } from "./nav-rail-container/nav-rail-container.component";

declare function plausible(eventName: string, options?: { props: any }): void;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: true,
  imports: [
    NavRailContainerComponent,
    NavRailComponent,
    RouterLink,
    NavRailContentComponent,
    RouterOutlet,
    MatToolbar,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatIcon,
    MatFabButton,
    NgIf,
    UserMenuContentComponent,
    Mat3NavButtonComponent,
    NgOptimizedImage,
  ],
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

  hasAds = false;
  userId: string = "";

  alainMode: boolean = false;

  @HostListener("window:resize", ["$event"])
  onResize(event) {
    this.enforceAlainMode();
  }

  enforceAlainMode() {
    if (typeof window !== "undefined") {
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

        if (typeof plausible !== "undefined") {
          plausible("pageview", { props: { authenticated: isAuthenticated } });
        }
      },
      (error) => {
        console.error(error);
      }
    );

    if (typeof window !== "undefined") {
      this.hasAds = window["canRunAds"];
    }

    // get the route name
    this.router.events
      .pipe(filter((event) => event instanceof RoutesRecognized))
      .pipe(
        map((event: RoutesRecognized) => {
          return event.state.root.firstChild.data["routeName"] || "";
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
        name: $localize`:Spot map navbar button label|A very short label for the navbar spot map label:Spot map`,
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
        name: $localize`:About page navbar button label|A very short label for the navbar about page button:About`,
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
