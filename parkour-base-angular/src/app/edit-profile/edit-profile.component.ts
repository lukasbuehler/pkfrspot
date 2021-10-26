import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { User } from "src/scripts/db/User";
import { AuthenticationService } from "../authentication.service";
import * as Croppie from "croppie";
import { DatabaseService } from "../database.service";
import { StorageFolder, StorageService } from "../storage.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import * as firebase from "firebase";

@Component({
  selector: "app-edit-profile",
  templateUrl: "./edit-profile.component.html",
  styleUrls: ["./edit-profile.component.scss"],
})
export class EditProfileComponent implements OnInit {
  @ViewChild("croppie") croppie: ElementRef;
  @Output("changes")
  changes: EventEmitter<boolean> = new EventEmitter<boolean>();

  user: User.Class = null;
  // user properties
  displayName: string = "";
  startDate: Date = null;

  newProfilePicture: File = null;
  newProfilePictureSrc: string = "";
  croppieObj: Croppie = null;
  isUpdatingProfilePicture: boolean = false;

  constructor(
    public authService: AuthenticationService,
    private _databaseService: DatabaseService,
    private _storageService: StorageService,
    private _snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.user = this.authService.user;
    this._updateInfoOnView();

    this.authService.authState$.subscribe((user) => {
      this.user = user;
      this._updateInfoOnView();
    });
  }

  private _updateInfoOnView() {
    if (this.user) {
      this.displayName = this.user.displayName;
      this.startDate = this.user.startDate;
    }
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
    this.detectIfChanges();
  }

  private saveNewProfilePicture() {
    this._handleProfilePictureUploadAndSave()
      .then(() => {
        this._snackbar.open(
          "Successfully saved new profile picture",
          "Dismiss",
          {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "bottom",
          }
        );
      })
      .catch((readableError) => {
        this._snackbar.open(readableError, "Dismiss", {
          duration: 5000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
      });
  }

  private _handleProfilePictureUploadAndSave(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (
        this.user &&
        this.user.uid &&
        this.newProfilePictureSrc &&
        this.croppieObj
      ) {
        const userId = this.user.uid;
        this.isUpdatingProfilePicture = true;

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
                      this.isUpdatingProfilePicture = false;
                      this.newProfilePicture = null;
                      this.user.profilePicture = url;
                      this.newProfilePictureSrc = "";
                      this.croppieObj.destroy();
                      resolve();
                    })
                    .catch((err) => {
                      console.error(
                        "Error saving the url to the newly uploaded profile picture",
                        err
                      );
                      this.isUpdatingProfilePicture = false;
                      reject("Error saving the uploaded profile picture!");
                    });
                },
                (err) => {
                  console.error("Error on profile picture upload", err);
                  reject("Error uploading the cropped image!");
                  this.isUpdatingProfilePicture = false;
                }
              );
          })
          .catch((err) => {
            console.error("Error getting the blob from croppie", err);
            reject("Error Cropping the image!");
            this.isUpdatingProfilePicture = false;
          });
      }
    });
  }

  detectIfChanges() {
    if (
      this.displayName !== this.user.displayName ||
      this.newProfilePicture ||
      this.startDate !== this.user.startDate
    ) {
      this.changes.emit(true);
    } else {
      this.changes.emit(false);
    }
  }

  saveAllChanges() {
    if (this.user && this.user.uid) {
      let promises: Promise<void>[] = [];
      let data: User.Schema = {};

      // Update display name if changed
      if (this.displayName !== this.user.displayName) {
        data.display_name = this.displayName;
      }

      // Update profile picture if changed
      if (
        this.newProfilePictureSrc &&
        this.croppieObj &&
        this.newProfilePicture
      ) {
        promises.push(this._handleProfilePictureUploadAndSave());
      }

      // Start date
      if (this.startDate !== this.user.startDate) {
        data.start_date = new firebase.default.firestore.Timestamp(
          this.startDate.getTime() / 1000,
          0
        );
      }

      // Update user data if changed
      if (Object.keys(data).length > 0) {
        promises.push(
          this._databaseService.updateUser(this.user.uid, data, true)
        );
      }

      return Promise.all(promises);
    }
  }
}
