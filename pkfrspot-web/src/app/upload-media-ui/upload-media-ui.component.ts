import { Optional, Self } from "@angular/core";
import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import {
  ControlValueAccessor,
  UntypedFormControl,
  FormControlName,
  UntypedFormGroup,
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
  @Input() maximumSizeInBytes: number = null;
  @Input() allowedMimeTypes: string[] = null;
  @Input() acceptString: string = null;
  @Output() changed = new EventEmitter<void>();
  @Output() uploadMedia = new EventEmitter<File>();

  uploadFile: File = null;
  uploadFileName: string = "";
  uploadFileSizeString: string = "";

  formGroup: UntypedFormGroup;

  hasError: boolean = false;
  private _errorMessage: string = "";
  get errorMessage() {
    return this._errorMessage;
  }

  constructor() {}

  ngOnInit() {
    this.formGroup = new UntypedFormGroup({
      input: new UntypedFormControl("", [Validators.required]),
    });
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

    if (this.allowedMimeTypes && this.allowedMimeTypes.includes(type)) {
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
    } else {
      console.log(
        "A file was selected, but its mime type is not allowed. Please select a different file.\n" +
          "Mime type of selected file is '" +
          type +
          "', allowed mime types are: " +
          this.allowedMimeTypes.join(", ") +
          "\n"
      );
      this._errorMessage = "The type of this file is not allowed";
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
