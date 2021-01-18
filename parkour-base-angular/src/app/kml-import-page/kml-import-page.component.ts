import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-kml-import-page",
  templateUrl: "./kml-import-page.component.html",
  styleUrls: ["./kml-import-page.component.scss"],
})
export class KmlImportPageComponent implements OnInit {
  /**
   * Steps:
   * 1) Upload KML
   * 2) Setup - Select folders, language, name regex, test
   * 3) Run - Runs in browsers and gets information from server
   * 4) Verify - Check possible duplicates, bounds
   * 5) Save - Apply changes and save new spots
   */

  uploadFormGroup: FormGroup;
  setupFormGroup: FormGroup;

  kmlUploadFile: File = null;

  constructor(private _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.uploadFormGroup = this._formBuilder.group({
      uploadCtrl: ["", Validators.required],
    });
    this.setupFormGroup = this._formBuilder.group({
      setupCtrl: ["", Validators.required],
    });
  }

  onUploadMediaSelect(file) {
    this.kmlUploadFile = file;
  }
}
