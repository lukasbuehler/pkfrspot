import { Component, OnInit } from "@angular/core";
import { User } from "src/scripts/db/User";
import { AuthenticationService } from "../authentication.service";

@Component({
  selector: "app-edit-profile",
  templateUrl: "./edit-profile.component.html",
  styleUrls: ["./edit-profile.component.scss"],
})
export class EditProfileComponent implements OnInit {
  user: User.Class = null;

  constructor(public authService: AuthenticationService) {}

  ngOnInit(): void {
    this.user = this.authService.user;
    this.authService.authState$.subscribe((user) => {
      this.user = user;
    });
  }
}
