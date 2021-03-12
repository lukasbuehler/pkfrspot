import { Self } from "@angular/core";
import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  NgControl,
  Validators,
} from "@angular/forms";
import { humanFileSize } from "./../../scripts/Helpers";

@Component({
  selector: "app-upload-media-ui",
  templateUrl: "./upload-media-ui.component.html",
  styleUrls: ["./upload-media-ui.component.scss"],
})
export class UploadMediaUiComponent implements OnInit, ControlValueAccessor {
  @Input() required: boolean = false;
  @Input() isMediaUpload: boolean = true;
  @Input() maximumSizeInBytes: number = null;
  @Input() requiredMimeType: string = null;
  @Input() acceptString: string = "";
  @Output() changed = new EventEmitter<void>();
  @Output() uploadMedia = new EventEmitter<File>();

  uploadFile: File = null;
  uploadFileName: string = "";
  uploadFileSizeString: string = "";

  formControl = new FormControl("", [Validators.required]);

  hasError: boolean = false;
  private _errorMessage: string = "";
  get errorMessage() {
    return this._errorMessage;
  }

  constructor(@Self() public ngControl: NgControl) {
    this.ngControl.valueAccessor = this;
  }

  ngOnInit() {
    this.formControl.validator;
  }

  writeValue() {}

  registerOnChange() {}

  registerOnTouched() {}

  setDisabledState?(isDisabled: boolean) {}

  public isImageSelected(): boolean {
    return this.uploadFile.type.includes("image");
  }

  onSelectFile(files: FileList) {
    this.hasError = false;
    let type = files.item(0).type;

    if (
      this.isMediaUpload &&
      !(type === "video/mp4" || type.includes("image"))
    ) {
      console.log(
        "A file was selected, but it was not an mp4 video nor an image. Please select media"
      );
      this._errorMessage = "An invalid media type was selected";
      this.hasError = true;
      return;
    }

    if (this.requiredMimeType !== null && this.requiredMimeType)
      if (
        this.maximumSizeInBytes !== null &&
        files.item(0).size > this.maximumSizeInBytes
      ) {
        // The selected file is too large
        console.log(
          `The selected file was too big. (Max: ${humanFileSize(
            this.maximumSizeInBytes
          )})`
        );
        this._errorMessage = `The selected file was too big. (It needs to be less than ${humanFileSize(
          this.maximumSizeInBytes
        )})`;
        this.hasError = true;
        return;
      }

    this.uploadFile = files.item(0);
    this.uploadFileName = this.uploadFile.name;
    this.uploadFileSizeString = humanFileSize(this.uploadFile.size, true);

    //console.log("File selected");

    this.changed.emit(); // Emit changes
    this.uploadMedia.emit(this.uploadFile);
  }
}
