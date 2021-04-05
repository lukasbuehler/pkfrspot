import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { User } from "src/scripts/db/User";
import { AuthenticationService } from "../authentication.service";
import * as Croppie from "croppie";
import { DatabaseService } from "../database.service";
import { StorageFolder, StorageService } from "../storage.service";

@Component({
  selector: "app-edit-profile",
  templateUrl: "./edit-profile.component.html",
  styleUrls: ["./edit-profile.component.scss"],
})
export class EditProfileComponent implements OnInit {
  @ViewChild("croppie") croppie: ElementRef;

  user: User.Class = null;
  newProfilePicture: File = null;
  newProfilePictureSrc: string = "";
  croppieObj: Croppie = null;

  constructor(
    public authService: AuthenticationService,
    private _databaseService: DatabaseService,
    private _storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.user;
    this.authService.authState$.subscribe((user) => {
      this.user = user;
    });
  }

  setNewProfilePicture(file: File) {
    this.newProfilePicture = file;

    if (
      this.croppie &&
      this.croppie.nativeElement.className === "croppie-container"
    ) {
      this.croppieObj.destroy();
    }

    this.croppieObj = new Croppie(document.getElementById("croppie"), {
      viewport: {
        width: 256,
        height: 256,
        type: "circle",
      },
      boundary: {
        width: 300,
        height: 300,
      },
      enableExif: true,
    });

    let reader = new FileReader();
    reader.onload = (event) => {
      this.newProfilePictureSrc = event.target.result as string;

      this.croppieObj.bind({
        url: this.newProfilePictureSrc,
      });
    };

    reader.readAsDataURL(file);
  }

  uploadAndSaveProfilePicture() {
    if (
      this.user &&
      this.user.uid &&
      this.newProfilePictureSrc &&
      this.croppieObj
    ) {
      const userId = this.user.uid;
      this.croppieObj
        .result({
          type: "blob",
          format: "png",
          circle: false,
        })
        .then((blob) => {
          this._storageService
            .setUploadToStorage(blob, StorageFolder.ProfilePictures, userId)
            .subscribe(
              (url) => {
                this._databaseService
                  .updateUser(
                    userId,
                    {
                      profile_picture: url,
                    },
                    true
                  )
                  .then(() => {
                    console.log("successfully saved the profile picture");
                  })
                  .catch((err) => {
                    console.error(
                      "Error saving the url to the newly uploaded profile picture",
                      err
                    );
                  });
              },
              (err) => {
                console.error("Error on profile picture upload");
              }
            );
        })
        .catch((err) => {
          console.error("Error getting the blob from croppie");
          console.error(err);
        });
    }
  }
}
