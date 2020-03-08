import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { MatDialogRef } from "@angular/material";

@Component({
  selector: "app-edit-post-dialog",
  templateUrl: "./edit-post-dialog.component.html",
  styleUrls: ["./edit-post-dialog.component.scss"]
})
export class EditPostDialogComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<EditPostDialogComponent>) {}

  @Input() isCreating = false;
  uploadFileName: string = "";

  ngOnInit() {}

  onSelectImage(files: FileList) {
    this.uploadFileName = files.item(0).name;
  }
}
