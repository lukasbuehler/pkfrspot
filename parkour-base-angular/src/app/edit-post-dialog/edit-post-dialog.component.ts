import { Component, OnInit, Input, ViewChild, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { humanFileSize } from "./../../scripts/Helpers";
import { Post } from "src/scripts/db/Post";
import { StorageService, StorageFolders } from "../storage.service";

export interface PostDialogData {
  isCreating: string;
}

@Component({
  selector: "app-edit-post-dialog",
  templateUrl: "./edit-post-dialog.component.html",
  styleUrls: ["./edit-post-dialog.component.scss"]
})
export class EditPostDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<EditPostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PostDialogData,
    private _storageService: StorageService
  ) {
    this.isCreating = Boolean(data.isCreating);
    console.log(this.isCreating);
  }

  isCreating: boolean = false;

  uploadFile: File = null;
  uploadFileName: string = "";
  uploadFileSizeString: string = "";

  hasChanged = false;

  postTitle: "";
  postBody: "";
  postImageSrc: "";

  ngOnInit() {}

  onSelectImage(files: FileList) {
    console.log(files);
    this.uploadFile = files.item(0);
    this.uploadFileName = this.uploadFile.name;
    this.uploadFileSizeString = humanFileSize(this.uploadFile.size, true);

    this.hasChanged = true;
  }

  makePostToReturn() {
    this._storageService.setUploadToStorage(
      this.uploadFile,
      StorageFolders.PostMedia
    );
    return {
      title: this.postTitle,
      body: this.postBody
    };
  }

  close() {
    this.dialogRef.close();
  }
}
