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
      text: "Parkour Base",
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
        name: "Map",
        link: "/map",
        badge: {
          number: 0,
          color: "accent",
        },
        tooltip: "",
      },
      {
        name: "Wiki",
        link: "/wiki",
        badge: {
          number: 0,
          color: "accent",
        },
        tooltip: "",
      },
      {
        name: "Teams",
        link: "/teams",
        badge: {
          number: 0,
          color: "accent",
        },
        tooltip: "",
      },
    ],
  };
}
