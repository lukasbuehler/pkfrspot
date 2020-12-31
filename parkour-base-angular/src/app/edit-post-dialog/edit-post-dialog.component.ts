import {
  Component,
  OnInit,
  Input,
  ViewChild,
  Inject,
  AfterViewInit,
} from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

import { Post } from "src/scripts/db/Post";
import { Spot } from "src/scripts/db/Spot";

import { StorageService, StorageFolders } from "../storage.service";
import { DatabaseService } from "../database.service";

import { FormControl } from "@angular/forms";
import { MatAutocomplete } from "@angular/material/autocomplete";

export interface PostDialogData {
  isCreating: string;
}

@Component({
  selector: "app-edit-post-dialog",
  templateUrl: "./edit-post-dialog.component.html",
  styleUrls: ["./edit-post-dialog.component.scss"],
})
export class EditPostDialogComponent implements AfterViewInit {
  constructor(
    public dialogRef: MatDialogRef<EditPostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PostDialogData,
    private _storageService: StorageService,
    private _databaseService: DatabaseService
  ) {
    this.isCreating = Boolean(data.isCreating);
  }

  isCreating: boolean = false;

  uploadFile: File = null;

  hasChanged = false;

  filteredSpots: Spot.Class[] = [];

  postTitle = "";
  postBody = "";
  postImageSrc = "";
  postLocation = "";
  postSpot: Spot.Class = null;

  // If this is false, then link is selected
  isUploadSelected = true;

  mediaLink = {
    text: "",
    platform: "",
    id: "",
  };

  linkInputFormControl = new FormControl("");

  ngAfterViewInit() {
    // TODO Remove in later:
    this._databaseService.getTestSpots(true).subscribe(
      (spots) => {
        spots.forEach((spot) => {
          this.filteredSpots.push(spot);
        });
        console.log(
          "Added " + spots.length + " spots to the autocomplete array"
        );
      },
      (error) => {
        console.error(error);
      }
    );
  }

  tabChanged(index: number) {
    if (index === 0) {
      this.isUploadSelected = true;
    } else if (index === 1) {
      this.isUploadSelected = false;
    }
    console.log("isUploadSelected " + this.isUploadSelected);
  }

  onLinkUpdate(str: string) {
    this.mediaLink.text = str;
    this.hasChanged = true;

    if (str) {
      if (str.includes("youtube") || str.includes("youtu.be")) {
        // It's a youtube video
        this.mediaLink.platform = "YouTube";

        // get the youtube video id
        let videoIdRegEx = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
        let videoIdMatch = videoIdRegEx.exec(str);
        if (videoIdMatch) {
          let id = videoIdMatch[1];
          this.mediaLink.id = id;
          let embedLink = `https://www.youtube.com/embed/${id}`;

          this.linkInputFormControl.setErrors(null);
        } else {
          this.linkInputFormControl.setErrors({
            invalid: true,
          });
        }
      } else if (str.includes("vimeo")) {
        // vimeo video
      } else {
        this.linkInputFormControl.setErrors({ invalid: true });
      }
    } else {
      this.linkInputFormControl.setErrors({ invalid: true });
    }
  }

  onUploadMediaSelect(file) {
    this.uploadFile = file;
  }

  makePostToReturn(): {
    title: string;
    body: string;
    mediaType: Post.MediaTypes;
    spot: Spot.Class;
  } {
    let isImage = false;
    let mediaType: Post.MediaTypes = Post.MediaTypes.None;
    if (this.uploadFile) {
      this._storageService.setUploadToStorage(
        this.uploadFile,
        StorageFolders.PostMedia
      );
      if (this.uploadFile.type.includes("image")) {
        mediaType = Post.MediaTypes.Image;
      }
    }

    return {
      title: this.postTitle,
      body: this.postBody || "",
      mediaType: mediaType,
      spot: this.postSpot,
    };
  }

  close() {
    console.log(this.postSpot);
    this.dialogRef.close();
  }

  selectSpot(value: string) {
    if (value) {
      let findSpot = this.filteredSpots.find((spot) => {
        return spot.id === value;
      });
      console.log(findSpot);
      if (findSpot) {
        this.postSpot = findSpot;
        return;
      }
    }
    this.postSpot = null;
  }

  getSpotNameFromId = (spotId) => {
    if (this.filteredSpots && this.filteredSpots.length > 0) {
      let findSpot = this.filteredSpots.find((spot) => {
        return spot.id === spotId;
      });
      if (findSpot) {
        return findSpot.data.name;
      }
    }

    return "";
  };
}
