import { Component, OnInit } from "@angular/core";
import { AuthenticationService } from "../authentication.service";

@Component({
  selector: "app-settings-page",
  templateUrl: "./settings-page.component.html",
  styleUrls: ["./settings-page.component.scss"],
})
export class SettingsPageComponent implements OnInit {
  constructor(public authService: AuthenticationService) {}

  menuPoints = [
    {
      id: "profile",
      name: "Profile information",
      icon: "person",
    },
    {
      id: "login",
      name: "Login information",
      icon: "vpn_key",
    },
    /*
    {
      id: "notifications",
      name: "Notifications",
      icon: "notifications",
    },
    {
      id: "security-privacy",
      name: "Security & Privacy",
      icon: "security",
    },
    {
      id: "delete",
      name: "Delete Profile",
      icon: "delete",
    },
    */
  ];

  selectedPoint: string = "profile";

  ngOnInit(): void {}

  openMenuPoint(pointId: string) {
    this.selectedPoint = pointId;
  }
}
