import { Component } from "@angular/core";
import { AuthenticationService } from "../authentication.service";

@Component({
  selector: "app-user-menu-content",
  templateUrl: "./user-menu-content.component.html",
  styleUrls: ["./user-menu-content.component.scss"],
})
export class UserMenuContentComponent {
  constructor(public authService: AuthenticationService) {}
}
