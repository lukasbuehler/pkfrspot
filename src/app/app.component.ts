import {
  AfterViewInit,
  Component,
  HostListener,
  inject,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
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
import { filter } from "rxjs/operators";
import { AuthenticationService } from "./services/firebase/authentication.service";
import { StorageService } from "./services/firebase/storage.service";
import { GlobalVariables } from "../scripts/global";
import { NgOptimizedImage } from "@angular/common";
import { MatFabButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import {
  MatMenuTrigger,
  MatMenu,
  MatMenuItem,
  MatMenuPanel,
} from "@angular/material/menu";
import { MatToolbar } from "@angular/material/toolbar";
import { NavRailContentComponent } from "./nav-rail-content/nav-rail-content.component";
import { Mat3NavButtonComponent } from "./mat3-nav-button/mat3-nav-button.component";
import { NavRailComponent } from "./nav-rail/nav-rail.component";
import { NavRailContainerComponent } from "./nav-rail-container/nav-rail-container.component";
import { WelcomeDialogComponent } from "./welcome-dialog/welcome-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { languageCodes } from "../scripts/Languages";
import { LocaleCode } from "../db/models/Interfaces";
import { MatSnackBar } from "@angular/material/snack-bar";

declare function plausible(eventName: string, options?: { props: any }): void;

interface ButtonBase {
  name: string;
  icon?: string;
  image?: string;
}

interface LinkButton extends ButtonBase {
  link: string;
  menu?: never;
  function?: never;
}

interface MenuButton extends ButtonBase {
  menu: MatMenuPanel<any>;
  link?: never;
  function?: never;
}

interface FunctionButton extends ButtonBase {
  function: () => void;
  link?: never;
  menu?: never;
}

type LinkMenuButton = LinkButton | MenuButton | FunctionButton;

type NavbarButton = LinkMenuButton & {
  spacerBefore?: boolean;
};

type NavbarButtonConfig = NavbarButton[];
type ButtonConfig = LinkMenuButton[];

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
    Mat3NavButtonComponent,
    NgOptimizedImage,
  ],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild("langMenu") langMenu: MatMenuPanel;
  @ViewChild("userMenu") userMenu: MatMenuPanel;

  readonly welcomeDialog = inject(MatDialog);
  private _snackbar = inject(MatSnackBar);

  constructor(
    public authService: AuthenticationService,
    public router: Router,
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

  availableLanguageCodes: LocaleCode[] = [
    "en",
    "de",
    "de-CH",
    "fr",
    "it",
    "es",
    "nl",
  ];

  languageCodes = languageCodes;

  @HostListener("window:resize", ["$event"])
  onResize(event: Event) {
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

  navbarConfig: NavbarButtonConfig;
  unauthenticatedUserMenuConfig: ButtonConfig;
  authenticatedUserMenuConfig: ButtonConfig;

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
            this.route.firstChild?.data.subscribe((data) => {
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
        if (user && user.uid) {
          if (user.uid !== this.userId) {
            this.userId = user.uid;
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
      this.hasAds = (window as any)["canRunAds"] ?? false;
    }

    // get the route name
    this.router.events
      .pipe(filter((event) => event instanceof RoutesRecognized))
      .subscribe((event: RoutesRecognized) => {
        const isEmbedded = event.url.split("/")[1] === "embedded";
        this.isEmbedded.set(isEmbedded);
      });
  }

  ngAfterViewInit() {
    this.unauthenticatedUserMenuConfig = [
      {
        name: $localize`:@@login.nav_label:Login`,
        link: "/sign-in",
        icon: "login",
      },
      {
        name: $localize`:@@create_acc.nav_label:Create Account`,
        link: "/sign-up",
        icon: "person_add",
      },
      {
        name: $localize`:Language button label|The label of the change language button@@lang_btn_label:Language`,
        icon: "language",
        menu: this.langMenu,
      },
      {
        name: $localize`:About page navbar button label|A very short label for the navbar about page button:About`,
        link: "/about",
        icon: "info",
      },
    ];

    this.navbarConfig = [
      // {
      //   name: "Posts",
      //   link: "/posts",
      //   icon: "question_answer",
      // },
      {
        name: $localize`:Spot map navbar button label|A very short label for the navbar spot map label@@spot_map_label:Spot map`,
        link: "/map",
        icon: "map",
      },
      {
        name: $localize`:@@events.nav_label:Events`,
        link: "/events",
        icon: "calendar_month", // or event, local_activity, calendar_month
      },
      {
        spacerBefore: true,
        name: $localize`Profile`,
        menu: this.userMenu,
        icon: "person",
      },
    ];

    this.authenticatedUserMenuConfig = [
      {
        name: $localize`:@@profile.nav_label:Profile`,
        link: "/u/", // + this.authService.user?.data?.uid,
        icon: "person",
      },
      {
        name: $localize`:@@settings.nav_label:Settings`,
        link: "/settings",
        icon: "settings",
      },
      {
        name: $localize`:About page navbar button label|A very short label for the navbar about page button:About`,
        link: "/about",
        icon: "info",
      },
      {
        name: $localize`:@@logout.nav_label:Logout`,
        function: this.logUserOut,
        icon: "logout",
      },
    ];
  }

  logUserOut() {
    if (!this.authService) {
      console.error("AuthService not available");
      return;
    }
    if (!this.authService.isSignedIn) {
      console.error("User is not signed in");
      return;
    }

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
