import {
  Component,
  HostListener,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
import {
  Router,
  RoutesRecognized,
  RouterLink,
  RouterOutlet,
  ActivatedRoute,
  NavigationEnd,
} from "@angular/router";
import { filter, map, tap } from "rxjs/operators";
import { AuthenticationService } from "./services/firebase/authentication.service";
import { StorageService } from "./services/firebase/storage.service";
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
import { WelcomeDialogComponent } from "./welcome-dialog/welcome-dialog.component";
import { MatDialog } from "@angular/material/dialog";

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
  readonly welcomeDialog = inject(MatDialog);

  constructor(
    public router: Router,
    public authService: AuthenticationService,
    public storageService: StorageService,
    private route: ActivatedRoute
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
    {
      name: "Français",
      url: this.baseUrl + "/fr/",
    },
    {
      name: "Italiano",
      url: this.baseUrl + "/it/",
    },
    {
      name: "Español",
      url: this.baseUrl + "/es/",
    },
    {
      name: "Nederlands",
      url: this.baseUrl + "/nl/",
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
    const currentTermsVersion = "1";

    let isABot: boolean = false;
    if (typeof window !== "undefined") {
      isABot =
        navigator.userAgent.match(
          /bot|googlebot|crawler|spider|robot|crawling/i
        ) !== null;
      let acceptedVersion = localStorage.getItem("acceptedVersion");

      if (
        !isABot &&
        acceptedVersion !== currentTermsVersion &&
        this.welcomeDialog.openDialogs.length === 0
      ) {
        this.router.events
          .pipe(filter((event) => event instanceof NavigationEnd))
          .subscribe(() => {
            this.route.firstChild.data.subscribe((data) => {
              // open welcome dialog if the user has not accepted the terms of service
              acceptedVersion = localStorage.getItem("acceptedVersion");

              if (acceptedVersion !== currentTermsVersion) {
                // get the acceptanceFree variable from the route data
                console.log("routeData", data);
                const acceptanceFree = data["acceptanceFree"] || false;

                console.log("acceptanceFree", acceptanceFree);

                if (!acceptanceFree) {
                  this.welcomeDialog.open(WelcomeDialogComponent, {
                    data: { version: currentTermsVersion },
                    hasBackdrop: true,
                    disableClose: true,
                  });
                } else {
                  // if the dialog was already open, close it now
                  this.welcomeDialog.closeAll();
                }
              }
            });
          });
      }
    }

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
        name: $localize`:Spot map navbar button label|A very short label for the navbar spot map label@@spot_map_label:Spot map`,
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
        icon: "calendar_month", // or event, local_activity, calendar_month
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
