import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { humanFileSize } from "./../../scripts/Helpers";

@Component({
  selector: "app-upload-media-ui",
  templateUrl: "./upload-media-ui.component.html",
  styleUrls: ["./upload-media-ui.component.scss"],
})
export class UploadMediaUiComponent implements OnInit {
  @Output() changed = new EventEmitter<void>();
  @Output() uploadMedia = new EventEmitter<File>();

  uploadFile: File = null;
  uploadFileName: string = "";
  uploadFileSizeString: string = "";

  constructor() {}

  ngOnInit() {}

  public isImageSelected(): boolean {
    return this.uploadFile.type.includes("image");
  }

  onSelectMedia(files: FileList) {
    let type = files.item(0).type;
    if (type === "video/mp4" || type.includes("image")) {
      this.uploadFile = files.item(0);
      this.uploadFileName = this.uploadFile.name;
      this.uploadFileSizeString = humanFileSize(this.uploadFile.size, true);

      console.log("Media selected");

      this.changed.emit(); // Emit changes
      this.uploadMedia.emit(this.uploadFile);
    }
  }
}
