import { Component } from "@angular/core";
import { AuthenticationService } from "./authentication.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  constructor(public authService: AuthenticationService) {}

  hasAds = window["canRunAds"];

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
