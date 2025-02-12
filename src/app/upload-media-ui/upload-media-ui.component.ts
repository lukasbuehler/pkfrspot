import { Optional, Self } from "@angular/core";
import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import {
  ControlValueAccessor,
  UntypedFormControl,
  FormControlName,
  UntypedFormGroup,
  NgControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { humanFileSize } from "./../../scripts/Helpers";
import { NgIf } from "@angular/common";
import { MatInput } from "@angular/material/input";
import {
  MatFormField,
  MatLabel,
  MatSuffix,
  MatHint,
  MatError,
} from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatMiniFabButton } from "@angular/material/button";

@Component({
  selector: "app-upload-media-ui",
  templateUrl: "./upload-media-ui.component.html",
  styleUrls: ["./upload-media-ui.component.scss"],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatMiniFabButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    MatSuffix,
    NgIf,
    MatHint,
    MatError,
  ],
})
export class UploadMediaUiComponent implements OnInit, ControlValueAccessor {
  @Input() required: boolean = false;
  @Input() maximumSizeInBytes: number | null = null;
  @Input() allowedMimeTypes: string[] | null = null;
  @Input() acceptString: string | null = null;
  @Output() changed = new EventEmitter<void>();
  @Output() uploadMedia = new EventEmitter<File>();

  uploadFile: File | null = null;
  uploadFileName: string = "";
  uploadFileSizeString: string = "";

  formGroup: UntypedFormGroup;

  hasError: boolean = false;
  private _errorMessage: string = "";
  get errorMessage() {
    return this._errorMessage;
  }

  constructor() {
    this.formGroup = new UntypedFormGroup({
      input: new UntypedFormControl("", [Validators.required]),
    });
  }

  ngOnInit() {}

  writeValue() {}

  registerOnChange() {}

  registerOnTouched() {}

  setDisabledState?(isDisabled: boolean) {}

  public isImageSelected(): boolean {
    return this.uploadFile?.type.includes("image") ?? false;
  }

  onSelectFile(eventTarget: EventTarget | null) {
    const files = (eventTarget as HTMLInputElement).files;

    const file = files?.item(0);

    if (!file) {
      return;
    }

    this.hasError = false;
    let type = file.type;

    if (this.allowedMimeTypes && this.allowedMimeTypes.includes(type)) {
      if (
        this.maximumSizeInBytes !== null &&
        file.size > this.maximumSizeInBytes
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
        "A file was selected, but its mimetype is not allowed. Please select a different file.\n" +
          "Mimetype of selected file is '" +
          type +
          "', allowed mime types are: " +
          (this.allowedMimeTypes
            ? this.allowedMimeTypes.join(", ")
            : "undefined") +
          "\n"
      );
      this._errorMessage = "The type of this file is not allowed";
      this.hasError = true;
      return;
    }

    this.uploadFile = file;
    this.uploadFileName = this.uploadFile.name;
    this.uploadFileSizeString = humanFileSize(this.uploadFile.size, true);

    //console.log("File selected");

    this.changed.emit(); // Emit changes
    this.uploadMedia.emit(this.uploadFile);
  }
}
