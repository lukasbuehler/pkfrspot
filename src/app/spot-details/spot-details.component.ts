import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnChanges,
  ElementRef,
  HostBinding,
  LOCALE_ID,
  Inject,
  AfterViewInit,
  Pipe,
  PipeTransform,
} from "@angular/core";
import {
  MatProgressBar,
  MatProgressBarModule,
} from "@angular/material/progress-bar";
import { Spot } from "../../scripts/db/Spot";
import { UploadMediaUiComponent } from "../upload-media-ui/upload-media-ui.component";
import { StorageService, StorageFolder } from "../services/storage.service";
import { Post } from "../../scripts/db/Post";
import { Observable, Subscription } from "rxjs";
import { AuthenticationService } from "../services/authentication.service";
import {
  AmenityIcons,
  AmenityNames,
  IndoorAmenities,
  OutdoorAmenities,
  GeneralAmenities,
  ContributedMedia,
  MediaType,
} from "../../scripts/db/Interfaces";

//import { MatTooltipModule } from "@angular/material/tooltip";

import {
  isoCountryCodeToFlagEmoji,
  getCountryNameInLanguage,
  getCountriesList,
  isMobileDevice,
} from "../../scripts/Helpers";
import { UntypedFormControl, FormsModule } from "@angular/forms";
import { map, startWith } from "rxjs/operators";
import { trigger, transition, style, animate } from "@angular/animations";
import { MapsApiService } from "../services/maps-api.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SpotReportDialogComponent } from "../spot-report-dialog/spot-report-dialog.component";
import { SpotReviewDialogComponent } from "../spot-review-dialog/spot-review-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { SpotReport } from "../../scripts/db/SpotReport.js";
import { MatSelect } from "@angular/material/select";
import { MediaPreviewGridComponent } from "../media-preview-grid/media-preview-grid.component";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { ImgCarouselComponent } from "../img-carousel/img-carousel.component";
import { SpotRatingComponent } from "../spot-rating/spot-rating.component";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIconButton, MatButton } from "@angular/material/button";
import { NgIf, KeyValuePipe, LocationStrategy } from "@angular/common";
import { MatChipListbox, MatChipsModule } from "@angular/material/chips";
import { MatRipple, MatOption } from "@angular/material/core";
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
  MatCardActions,
} from "@angular/material/card";
import { create } from "core-js/core/object";
import { MatDividerModule } from "@angular/material/divider";
import { SpotsService } from "../services/firestore-services/spots.service";
import { SpotReportsService } from "../services/firestore-services/spot-reports.service";
import { PostsService } from "../services/firestore-services/posts.service";
import { SpotReview } from "../../scripts/db/SpotReview.js";
import { SpotReviewsService } from "../services/firestore-services/spot-reviews.service";

declare function plausible(eventName: string, options?: { props: any }): void;

@Pipe({ name: "reverse", standalone: true })
export class ReversePipe implements PipeTransform {
  transform(value: any[]): any[] {
    if (!Array.isArray(value)) {
      return value;
    }
    return value.slice().reverse();
  }
}

@Component({
    selector: "app-spot-details",
    templateUrl: "./spot-details.component.html",
    styleUrls: ["./spot-details.component.scss"],
    animations: [
        trigger("grow", [
            transition("void <=> *", []),
            transition("* <=> *", [style({ height: "{{startHeight}}px" }), animate(".3s ease")], { params: { startHeight: 0 } }),
        ]),
    ],
    imports: [
        MatCard,
        MatRipple,
        MatCardHeader,
        MatCardTitle,
        MatCardSubtitle,
        MatChipsModule,
        NgIf,
        MatIconButton,
        MatTooltip,
        MatIcon,
        MatCardContent,
        ImgCarouselComponent,
        MatButton,
        FormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        MediaPreviewGridComponent,
        UploadMediaUiComponent,
        // MatSelect,
        // NgFor,
        // MatOption,
        MatChipListbox,
        MatCardActions,
        SpotRatingComponent,
        MatDividerModule,
        MatProgressBarModule,
        KeyValuePipe,
        ReversePipe,
    ]
})
export class SpotDetailsComponent implements AfterViewInit, OnChanges {
  @Input() spot: Spot.Class;
  @Input() infoOnly: boolean = false;
  @Input() dismissable: boolean = false;
  @Input() flat: boolean = false;
  @Input() clickable: boolean = false;
  @Input() editable: boolean = false;
  @Input() isEditing: boolean = false;

  @Output()
  isEditingChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() addBoundsClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() focusClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() saveClick: EventEmitter<Spot.Class> =
    new EventEmitter<Spot.Class>();
  @Output() discardClick: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild(UploadMediaUiComponent) uploadMediaComp;

  isSaving: boolean = false;

  AmenityIcons = AmenityIcons;
  AmenityNames = AmenityNames;
  IndoorAmenities = IndoorAmenities;
  OutdoorAmenities = OutdoorAmenities;
  GeneralAmenities = GeneralAmenities;

  visited: boolean = false;
  bookmarked: boolean = false;

  spotTypes = Object.values(Spot.Types);
  spotAreas = Object.values(Spot.Areas);

  newSpotImage: File = null;

  spotPosts: Post.Class[] = [];
  postSubscription: Subscription;

  countries: any[] = [];
  filteredCountries: Observable<any[]>;
  stateCtrl = new UntypedFormControl();

  report: SpotReport | null = null;

  automaticallyDetermineAddress: boolean = true;

  isAppleMaps: boolean = false;

  get isNewSpot() {
    return this.spot && !this.spot.id;
  }

  startHeight: number = 0;

  @HostBinding("@grow") get grow() {
    return { value: this.spot, params: { startHeight: this.startHeight } };
  }

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    public authenticationService: AuthenticationService,
    public reportDialog: MatDialog,
    public reviewDialog: MatDialog,
    private _locationStrategy: LocationStrategy,
    private _element: ElementRef,
    private _spotsService: SpotsService,
    private _spotReportsService: SpotReportsService,
    private _spotReviewsService: SpotReviewsService,
    private _postsService: PostsService,
    private _storageService: StorageService,
    private _mapsApiService: MapsApiService,
    private _snackbar: MatSnackBar
  ) {
    this.filteredCountries = this.stateCtrl.valueChanges.pipe(
      startWith(""),
      map((country) =>
        country ? this._filterCountries(country) : this.countries.slice()
      )
    );
  }

  ngAfterViewInit() {
    this.countries = getCountriesList("en"); // TODO wtf to do about this

    this.isAppleMaps = this._mapsApiService.isMacOSOriOS();
  }

  ngOnChanges() {
    //console.log(this._element.nativeElement.clientHeight);

    this.startHeight = this._element.nativeElement.clientHeight;

    this.loadReportForSpot();
  }

  private _filterCountries(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.countries.filter(
      (country) => country.name.toLowerCase().indexOf(filterValue) === 0
    );
  }

  selectedTabChanged(number: number) {
    if (number === 1) {
      // Post Tab selected
      this.loadSpotPosts();
    } else {
      this.unsubscribeFromSpotPosts();
    }
  }

  dismissed() {
    if (this.dismissable) {
      this.isEditing = false;
      this.isEditingChange.emit(false);

      this.dismiss.emit(true);
    }
  }

  editButtonClick() {
    if (this.editable && this.authenticationService.isSignedIn) {
      this.isEditing = true;
      this.isEditingChange.emit(true);
    }
  }
  saveButtonClick() {
    this.isSaving = true;

    this.saveClick.emit(this.spot);
  }
  discardButtonClick() {
    this.discardClick.emit();
    this.isEditing = false;
    this.isEditingChange.emit(false);

    if (this.isNewSpot) {
      // close the compact view as well
      this.dismissed();
    }
  }

  addBoundsClicked() {
    if (!this.spot.id) {
      console.error("the spot needs to be saved first before adding bounds");
    }
    if (!this.isEditing) {
      this.isEditing = true;
      this.isEditingChange.emit(true);
    }
    this.addBoundsClick.emit();
  }

  focusButtonClick() {
    console.log("Focus button clicked");
    this.focusClick.emit();
  }

  rateClick() {
    // TODO
  }

  bookmarkClick() {
    this.bookmarked = !this.bookmarked;
  }

  visitedClick() {
    this.visited = !this.visited;
  }

  addressChanged(newAddress) {
    this.spot.address.formatted = newAddress;
  }

  setSpotImage(file: File) {
    console.log("setting image");
    if (file && this.uploadMediaComp.isImageSelected()) {
      this.newSpotImage = file;
    } else {
      this.newSpotImage = null;
    }
  }

  uploadImage() {
    if (!this.newSpotImage) {
      console.error("No file selected or passed to this component");
    }

    if (this.uploadMediaComp) {
      if (this.uploadMediaComp.isImageSelected()) {
        let observable = this._storageService.setUploadToStorage(
          this.newSpotImage,
          StorageFolder.SpotPictures
        );

        observable.then(
          (imageLink) => {
            this.spot.addMedia(
              this._spotsService,
              imageLink,
              MediaType.Image,
              this.authenticationService.user.uid
            );

            if (typeof plausible !== "undefined") {
              plausible("Upload Spot Image", {
                props: { spotId: this.spot.id },
              });
            }
          },
          (error) => {}
        );
      } else {
        console.error("Selected media is not an image");
      }
    } else {
      console.error("The upload media is not even loaded");
    }
  }

  mediaChanged(newSpotMedia) {
    this.spot.setMedia(newSpotMedia, this._spotsService, this._storageService);
  }

  async shareSpot() {
    const url = "https://pkfrspot.com";
    const baseUrl = this._locationStrategy.getBaseHref();

    // TODO use slug instead of id if available

    const link = url + "/map/" + this.spot.id;

    if (navigator["share"]) {
      try {
        const shareData = {
          title: "Spot: " + this.spot.getName(this.locale),
          text: `PKFR Spot: ${this.spot.getName(this.locale)}`,
          url: link,
        };

        await navigator["share"](shareData);
      } catch (err) {
        console.error("Couldn't share this spot");
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(
        `${this.spot.getName(this.locale)} - PKFR Spot\n${link}`
      );
      this._snackbar.open("Link to spot copied to clipboard", "Dismiss", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "top",
      });
    }

    if (typeof plausible !== "undefined") {
      plausible("Share Spot", { props: { spotId: this.spot.id } });
    }
  }

  openSpotInMaps() {
    if (typeof plausible !== "undefined") {
      plausible("Opening in Maps", { props: { spotId: this.spot.id } });
    }
    this._mapsApiService.openLatLngInMaps(this.spot.location);
  }

  openDirectionsInMaps() {
    if (typeof plausible !== "undefined") {
      plausible("Opening in Google Maps", { props: { spotId: this.spot.id } });
    }
    this._mapsApiService.openDirectionsInMaps(this.spot.location);
  }

  loadReportForSpot() {
    this._spotReportsService
      .getSpotReportsBySpotId(this.spot.id)
      .then((reports) => {
        this.report = reports[0] || null;
      });
  }

  hasBounds() {
    return this.spot?.hasBounds();
  }

  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }

  loadSpotPosts() {
    console.log("Loading posts");
    this.postSubscription = this._postsService
      .getPostsFromSpot(this.spot)
      .subscribe(
        (postsSchemaMap) => {
          console.log(postsSchemaMap);
          this.spotPosts = [];
          for (let id in postsSchemaMap) {
            this.spotPosts.push(new Post.Class(id, postsSchemaMap[id]));
          }
        },
        (error) => {},
        () => {}
      );
  }

  unsubscribeFromSpotPosts() {
    if (!this.postSubscription) {
      return;
    }

    console.log("Unsubscribing...");
    this.postSubscription.unsubscribe();
  }

  getCountryNameFromShortCode(shortCountryCode) {
    return getCountryNameInLanguage(shortCountryCode);
  }

  getCountryEmojiFromAlpha2(countryAlpha2Code) {
    return isoCountryCodeToFlagEmoji(countryAlpha2Code);
  }

  automaticallyDetermineCountryAndAddressToggleChanged(change) {
    this.automaticallyDetermineAddress = change.checked;
  }

  openSpotReportDialog() {
    const spotReportData: SpotReport = {
      spot: {
        id: this.spot.id,
        name: this.spot.data.name.en ?? this.spot.getName(this.locale),
      },
      user: {
        uid: this.authenticationService.user.uid,
        display_name: this.authenticationService.user.data.displayName,
      },
      reason: "",
    };
    const dialogRef = this.reportDialog.open(SpotReportDialogComponent, {
      data: spotReportData,
    });
  }

  openSpotReviewDialog() {
    const uid = this.authenticationService.user.uid;
    const spotId = this.spot.id;
    let isUpdate: boolean = false;

    let review: SpotReview = null;

    // TODO somehow show that we are loading the review

    // check if the user has already reviewed this spot
    this._spotReviewsService
      .getSpotReviewById(spotId, uid)
      .then((_review) => {
        review = _review;
        isUpdate = true;
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        // otherwise create an empty review
        if (!review) {
          review = {
            spot: {
              name: this.spot.getName(this.locale),
              id: spotId,
            },
            user: {
              uid: uid,
              display_name: this.authenticationService.user.data.displayName,
            },
            rating: 0,
            comment: {
              text: "",
              locale: this.locale,
            },
          };
        } else {
          if (!review.comment?.text || !review.comment?.locale) {
            review.comment = {
              text: "",
              locale: this.locale,
            };
          }
        }

        const dialogRef = this.reviewDialog.open(SpotReviewDialogComponent, {
          data: {
            review: review,
            isUpdate: isUpdate,
          },
        });
      });
  }
}
