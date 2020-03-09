import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { MatDialogRef } from "@angular/material";
import { humanFileSize } from "./../../scripts/Helpers";

@Component({
  selector: "app-edit-post-dialog",
  templateUrl: "./edit-post-dialog.component.html",
  styleUrls: ["./edit-post-dialog.component.scss"]
})
export class EditPostDialogComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<EditPostDialogComponent>) {}

  @Input() isCreating = false;
  uploadFile: File = null;
  uploadFileName: string = "";
  uploadFileSizeString: string = "";

  hasChanged = false;

  ngOnInit() {}

  onSelectImage(files: FileList) {
    console.log(files);
    this.uploadFile = files.item(0);
    this.uploadFileName = this.uploadFile.name;
    this.uploadFileSizeString = humanFileSize(this.uploadFile.size, true);
  }

  savePost() {
    // upload the content
    // create the post in the DB
  }

  close() {
    this.dialogRef.close();
  }
}
