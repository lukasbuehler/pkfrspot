import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { KmlParserService, KMLSetupInfo, KMLSpot } from "../kml-parser.service";
import { filter, first, firstValueFrom } from "rxjs";

@Component({
  selector: "app-kml-import-page",
  templateUrl: "./kml-import-page.component.html",
  styleUrls: ["./kml-import-page.component.scss"],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
})
export class KmlImportPageComponent implements OnInit, AfterViewInit {
  @ViewChild("stepperHorizontal") stepperHorizontal;
  @ViewChild("spotMap") spotMap;

  uploadFormGroup: UntypedFormGroup;
  setupFormGroup: UntypedFormGroup;

  kmlUploadFile: File = null;

  private _selectedVerificationSpot: KMLSpot | null = null;
  get selectedVerificationSpot(): KMLSpot | null {
    return this._selectedVerificationSpot;
  }
  set selectedVerificationSpot(value: KMLSpot | null) {
    this._selectedVerificationSpot = value;
    if (this.spotMap)
      this.spotMap.focusPoint(this._selectedVerificationSpot.spot.location);
  }

  languages: string[] = [
    "English (en)",
    "Deutsch (de)",
    "Schwiizerdütsch (de-CH)",
  ];

  constructor(
    private _formBuilder: UntypedFormBuilder,
    public kmlParserService: KmlParserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.uploadFormGroup = this._formBuilder.group({
      uploadCtrl: ["", Validators.required],
    });
    this.setupFormGroup = this._formBuilder.group({
      setupLangCtrl: ["", Validators.required],
      setupRegexCtrl: ["", []],
    });
  }

  ngAfterViewInit(): void {}

  onUploadMediaSelect(file) {
    this.kmlUploadFile = file;
  }

  getSpotLocations(spots: KMLSpot[]): google.maps.LatLngLiteral[] {
    return spots.map((spot) => spot.spot.location);
  }

  continueToSetup() {
    if (!this.kmlUploadFile) {
      // the file doesn't exist
      console.error("The KML file was not set properly or is invalid!");
      return;
    }
    this.kmlUploadFile.text().then((data) => {
      this.kmlParserService.parseKMLFromString(data).then(
        () => {
          // parsing was successful
          this.stepperHorizontal.selected.completed = true;
          this.stepperHorizontal.next();
          //this.cdr.detectChanges();
        },
        (error) => {
          // parsing was not successful
          console.error(error);
        }
      );
    });
  }

  continueToVerification() {
    this.kmlParserService.confirmSetup();

    this.stepperHorizontal.selected.completed = true; // TODO move
    this.stepperHorizontal.next();

    firstValueFrom(
      this.kmlParserService.spotsToImport$.pipe(
        filter((spots) => spots && spots.length > 0), // Ignore null, undefined, or empty arrays
        first() // Take only the first non-null and non-empty array
      )
    ).then((spots) => {
      if (spots.length > 0 && !this.selectedVerificationSpot) {
        this.selectedVerificationSpot = spots[0];
        console.log("Selected spot: ", this.selectedVerificationSpot);
      }
    });

    this.cdr.detectChanges();
  }
}
