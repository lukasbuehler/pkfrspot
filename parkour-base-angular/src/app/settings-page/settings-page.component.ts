import { Component, OnInit, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthenticationService } from "../authentication.service";
import { EditProfileComponent } from "../edit-profile/edit-profile.component";
import { SpeedDialFabButtonConfig } from "../speed-dial-fab/speed-dial-fab.component";

@Component({
  selector: "app-settings-page",
  templateUrl: "./settings-page.component.html",
  styleUrls: ["./settings-page.component.scss"],
})
export class SettingsPageComponent implements OnInit {
  @ViewChild("editProfileComponent") editProfileComponent: EditProfileComponent;

  constructor(
    public authService: AuthenticationService,
    private _snackbar: MatSnackBar
  ) {}

  menuPoints = [
    {
      id: "profile",
      name: "Public profile",
      icon: "person",
      hasChanges: false,
    },
    {
      id: "login",
      name: "Login information",
      icon: "vpn_key",
      hasChanges: false,
    },
    {
      id: "general",
      name: "General",
      icon: "settings",
      hasChanges: false,
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

  hasChanges: boolean = false;

  speedDialButtonConfig: SpeedDialFabButtonConfig = {
    mainButton: {
      icon: "save",
      tooltip: "Save all changes",
      color: "accent",
    },
    miniButtonColor: "default",
    miniButtons: [
      {
        icon: "clear",
        tooltip: "Discard all changes",
      },
    ],
  };

  ngOnInit(): void {}

  openMenuPoint(pointId: string) {
    this.selectedPoint = pointId;
  }

  profileHasChanges(hasChanges) {
    this.menuPoints[0].hasChanges = hasChanges;
    this.updateChanges();
  }

  updateChanges() {
    for (let point of this.menuPoints) {
      if (point.hasChanges) {
        this.hasChanges = true;
        return;
      }
    }
    this.hasChanges = false;
  }

  saveAllChanges() {
    // Save all changes in components
    this.editProfileComponent
      .saveAllChanges()
      .then(() => {
        this._snackbar.open("Successfully saved all changes!", "Dismiss", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
        this.menuPoints[0].hasChanges = false;
        this.hasChanges = false;

        // refetch all the userdata since it has changed!
        this.authService.refetchUserData();
      })
      .catch((err) => {
        this._snackbar.open(
          "Error saving all changes! Please try again later.",
          "Dismiss",
          {
            duration: 5000,
            horizontalPosition: "center",
            verticalPosition: "bottom",
          }
        );
      });

    // Save all changes here
  }
}
