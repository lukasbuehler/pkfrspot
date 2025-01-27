import {
  Component,
  HostListener,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
import {
  Router,
  RoutesRecognized,
  RouterLink,
  RouterOutlet,
} from "@angular/router";
import { filter, map, tap } from "rxjs/operators";
import { AuthenticationService } from "./services/authentication.service";
import { StorageService } from "./services/storage.service";
import { GlobalVariables } from "../scripts/global";
import { UserMenuContentComponent } from "./user-menu-content/user-menu-content.component";
import { NgOptimizedImage } from "@angular/common";
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

  hasAds = false;
  userId: string = "";

  alainMode: boolean = false;

  isEmbedded: WritableSignal<boolean> = signal(false);

  baseUrl = "https://pkfrspot.com";

  languages: {
    name: string;
    url: string;
  }[] = [
    {
      name: "English",
      url: this.baseUrl + "/en/",
    },
    {
      name: "Deutsch",
      url: this.baseUrl + "/de/",
    },
    {
      name: "Schwiizerdütsch",
      url: this.baseUrl + "/de-CH/",
    },
    // {
    //   name: "Français",
    //   url: this.baseUrl + "/fr/",
    // },
    {
      name: "Italiano",
      url: this.baseUrl + "/it/",
    },
  ];

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
      .subscribe((event: RoutesRecognized) => {
        const isEmbedded = event.url.split("/")[1] === "embedded";
        this.isEmbedded.set(isEmbedded);
      });
  }

  navbarConfig = {
    color: "primary",
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
        name: $localize`Events`,
        link: "/events",
        icon: "local_activity", // or event, local_activity, calendar_month
      },
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
