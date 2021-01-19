import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatHorizontalStepper } from "@angular/material/stepper";
import { KmlParserService, KMLSetupInfo } from "../kml-parser.service";

@Component({
  selector: "app-kml-import-page",
  templateUrl: "./kml-import-page.component.html",
  styleUrls: ["./kml-import-page.component.scss"],
})
export class KmlImportPageComponent implements OnInit {
  @ViewChild("stepperHorizontal") stepperHorizontal: MatHorizontalStepper;

  /**
   * Steps:
   * 1) Select KML
   * 2) Setup - Select folders, language, name regex, test
   * 3) Run - Runs in browsers and gets information from server
   * 4) Verify - Check possible duplicates, bounds
   * 5) Save - Apply changes and save new spots
   */

  uploadFormGroup: FormGroup;
  setupFormGroup: FormGroup;

  kmlUploadFile: File = null;
  kmlSetupInfo: KMLSetupInfo;

  languages: string[] = [
    "English (en)",
    "Deutsch (de)",
    "Schwiizerdütsch (de-CH)",
  ];

  constructor(
    private _formBuilder: FormBuilder,
    private _kmlParserService: KmlParserService
  ) {}

  ngOnInit(): void {
    this.uploadFormGroup = this._formBuilder.group({
      uploadCtrl: ["", Validators.required],
    });
    this.setupFormGroup = this._formBuilder.group({
      setupLangCtrl: ["", Validators.required],
      setupRegExCtrl: [""],
    });
  }

  onUploadMediaSelect(file) {
    this.kmlUploadFile = file;
  }

  continueToSetup() {
    this.kmlUploadFile.text().then(
      (data) => {
        this._kmlParserService.parseKMLString$(data).subscribe(
          () => {
            // parsing was successful
            this.stepperHorizontal.next();

            this._kmlParserService.getKMLPreviewInfo().subscribe(
              (kmlSetupInfo: KMLSetupInfo) => {
                this.kmlSetupInfo = kmlSetupInfo;
              },
              (error) => {
                console.error(error);
              }
            );
          },
          (error) => {
            // parsing was not successful
            console.error(error);
          }
        );
      },
      (reason) => {}
    );
  }
}
