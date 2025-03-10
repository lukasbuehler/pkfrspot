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
  CUSTOM_ELEMENTS_SCHEMA,
  Signal,
  signal,
  input,
  computed,
  effect,
  WritableSignal,
  model,
} from "@angular/core";
import {
  MatProgressBar,
  MatProgressBarModule,
} from "@angular/material/progress-bar";
import { LocalSpot, Spot } from "../../db/models/Spot";
import { MediaUpload } from "../media-upload/media-upload.component";
import { Post } from "../../db/models/Post";
import {
  StorageService,
  StorageFolder,
} from "../services/firebase/storage.service";
import { Observable, Subscription } from "rxjs";
import { AuthenticationService } from "../services/firebase/authentication.service";
import {
  AmenityIcons,
  AmenityNames,
  IndoorAmenities,
  OutdoorAmenities,
  GeneralAmenities,
  ContributedMedia,
  MediaType,
  LocaleCode,
  Media,
} from "../../db/models/Interfaces";

//import { MatTooltipModule } from "@angular/material/tooltip";

import {
  isoCountryCodeToFlagEmoji,
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
import { SpotReportSchema } from "../../db/schemas/SpotReportSchema";
import { Types, Areas, SpotAddressSchema } from "../../db/schemas/SpotSchema";
import { MatSelect } from "@angular/material/select";
import { MediaPreviewGridComponent } from "../media-preview-grid/media-preview-grid.component";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { ImgCarouselComponent } from "../img-carousel/img-carousel.component";
import { SpotRatingComponent } from "../spot-rating/spot-rating.component";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIconButton, MatButton } from "@angular/material/button";
import {
  KeyValuePipe,
  LocationStrategy,
  NgOptimizedImage,
} from "@angular/common";
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
import { SpotsService } from "../services/firebase/firestore/spots.service";
import { SpotReportsService } from "../services/firebase/firestore/spot-reports.service";
import { PostsService } from "../services/firebase/firestore/posts.service";
import { SpotReviewSchema } from "../../db/schemas/SpotReviewSchema";
import { SpotReviewsService } from "../services/firebase/firestore/spot-reviews.service";
import { getValueFromEventTarget } from "../../scripts/Helpers";

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

@Pipe({ name: "asRatingKey" })
export class AsRatingKeyPipe implements PipeTransform {
  transform(value: any): "1" | "2" | "3" | "4" | "5" {
    return value.toString() as "1" | "2" | "3" | "4" | "5";
  }
}

@Component({
  selector: "app-spot-details",
  templateUrl: "./spot-details.component.html",
  styleUrls: ["./spot-details.component.scss"],
  animations: [
    trigger("grow", [
      transition("void <=> *", []),
      transition(
        "* <=> *",
        [style({ height: "{{startHeight}}px" }), animate(".3s ease")],
        { params: { startHeight: 0 } }
      ),
    ]),
  ],
  imports: [
    MatCard,
    MatRipple,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatChipsModule,
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
    MediaUpload,
    // MatSelect,
    // MatOption,
    MatChipListbox,
    MatCardActions,
    SpotRatingComponent,
    MatDividerModule,
    MatProgressBarModule,
    KeyValuePipe,
    ReversePipe,
    AsRatingKeyPipe,
    NgOptimizedImage,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SpotDetailsComponent implements AfterViewInit, OnChanges {
  spot = model<Spot | LocalSpot | null>(null);
  @Input() infoOnly: boolean = false;
  @Input() dismissable: boolean = false;
  @Input() border: boolean = false;
  @Input() clickable: boolean = false;
  @Input() editable: boolean = false;
  @Input() isEditing: boolean = false;

  @Output()
  isEditingChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() addBoundsClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() focusClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() saveClick: EventEmitter<Spot> = new EventEmitter<Spot>();
  @Output() discardClick: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild(MediaUpload)
  mediaUploadComponent: MediaUpload | null = null;

  getValueFromEventTarget = getValueFromEventTarget;

  isSaving: boolean = false;

  AmenityIcons = AmenityIcons;
  AmenityNames = AmenityNames;
  IndoorAmenities = IndoorAmenities;
  OutdoorAmenities = OutdoorAmenities;
  GeneralAmenities = GeneralAmenities;

  visited: boolean = false;
  bookmarked: boolean = false;

  spotTypes = Object.values(Types);
  spotAreas = Object.values(Areas);

  newSpotImage: File | null = null;

  spotPosts: Post.Class[] = [];
  postSubscription: Subscription | null = null;

  countries: any[] = [];
  filteredCountries: Observable<any[]>;
  stateCtrl = new UntypedFormControl();

  report: SpotReportSchema | null = null;

  automaticallyDetermineAddress: boolean = true;

  isAppleMaps: boolean = false;

  mediaStorageFolder: StorageFolder = StorageFolder.SpotPictures;

  googlePlace = signal<
    | {
        name: string;
        rating?: number;
        photo_url?: string;
        url?: string;
        opening_hours?: any;
      }
    | undefined
  >(undefined);

  get isNewSpot() {
    return this.spot() instanceof LocalSpot;
  }

  startHeight: number = 0;

  @HostBinding("@grow") get grow() {
    return { value: this.spot(), params: { startHeight: this.startHeight } };
  }

  constructor(
    @Inject(LOCALE_ID) public locale: LocaleCode,
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

    effect(() => {
      const spot = this.spot();

      if (spot instanceof Spot) {
        this._loadGooglePlaceDataForSpot();
      }
    });
  }

  ngAfterViewInit() {
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

    this.saveClick.emit(this.spot() as Spot);
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

  descriptionTextChanged(
    spot: LocalSpot | Spot,
    eventTarget: EventTarget | null
  ) {
    const value = getValueFromEventTarget(eventTarget);

    if (!value) return;

    spot.setDescription(value, this.locale);
  }

  addBoundsClicked() {
    if (this.spot() instanceof LocalSpot) {
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

  // addressChanged(newAddress: SpotAddressSchema) {
  //   this.spot.address.set(newAddress);
  // }

  setNewMediaFromUpload(media: { url: string }) {
    console.log("Setting new media from upload");
    const spot = this.spot();
    if (!spot) {
      console.error("No spot to add media to");
      return;
    }

    this.spot.update((spot) => {
      if (spot) {
        if (!this.authenticationService.user.uid) {
          console.error("User not signed in, cannot upload media");
          return spot;
        }

        spot.addMedia(
          media.url,
          MediaType.Image,
          this.authenticationService.user.uid
        );
      }
      if (spot instanceof Spot) {
        // if possible, already save the uploaded media
        this._spotsService.updateSpotMedia(spot.id, spot.media());
      }

      console.debug("Spot after adding media", spot);
      return spot;
    });

    this.mediaUploadComponent?.clear();

    if (typeof plausible !== "undefined") {
      if (this.spot instanceof Spot) {
        plausible("Upload Spot Image", {
          props: { spotId: this.spot.id },
        });
      }
    }
  }

  mediaChanged(newSpotMedia: ContributedMedia[]) {
    this.spot()?.userMedia.set(newSpotMedia);
  }

  async shareSpot() {
    const spot = this.spot();
    if (!(spot instanceof Spot)) {
      console.error("Cannot share a spot that hasn't been saved yet");
      return;
    }

    const url = "https://pkfrspot.com";
    const baseUrl = this._locationStrategy.getBaseHref();

    // TODO use slug instead of id if available

    const link = url + "/map/" + spot.id;

    if (navigator["share"]) {
      try {
        const shareData = {
          title: "Spot: " + spot.name(),
          text: `PKFR Spot: ${spot.name()}`,
          url: link,
        };

        await navigator["share"](shareData);
      } catch (err) {
        console.error("Couldn't share this spot");
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(`${spot.name()} - PKFR Spot \n${link}`);
      this._snackbar.open("Link to spot copied to clipboard", "Dismiss", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "top",
      });
    }

    if (typeof plausible !== "undefined") {
      plausible("Share Spot", { props: { spotId: spot.id } });
    }
  }

  openSpotInMaps() {
    const spot = this.spot();
    if (typeof plausible !== "undefined" && spot instanceof Spot) {
      plausible("Opening in Maps", { props: { spotId: spot.id } });
    }
    if (spot) this._mapsApiService.openLatLngInMaps(spot.location());
  }

  openDirectionsInMaps() {
    const spot = this.spot();
    if (typeof plausible !== "undefined" && spot instanceof Spot) {
      plausible("Opening in Google Maps", { props: { spotId: spot.id } });
    }

    if (spot) this._mapsApiService.openDirectionsInMaps(spot.location());
  }

  loadReportForSpot() {
    const spot = this.spot();
    if (!(spot instanceof Spot)) return;

    this._spotReportsService.getSpotReportsBySpotId(spot.id).then((reports) => {
      this.report = reports[0] || null;
    });
  }

  private _loadGooglePlaceDataForSpot() {
    if (!this.spot()?.googlePlaceId()) {
      this.googlePlace.set(undefined);
      return;
    }

    this._mapsApiService
      .getGooglePlaceById(this.spot()!.googlePlaceId()!)
      .then((place) => {
        const photoUrl = this._mapsApiService.getPhotoURLOfGooglePlace(place);
        this.googlePlace.set({
          name: place.name ?? "",
          rating: place.rating,
          photo_url: photoUrl ?? undefined,
          opening_hours: place.opening_hours,
          url: place.url,
        });
      });
  }

  hasBounds() {
    return this.spot()?.hasBounds();
  }

  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }

  loadSpotPosts() {
    // if (!(this.spot instanceof Spot)) return;
    // console.log("Loading posts");
    // this.postSubscription = this._postsService
    //   .getPostsFromSpot(this.spot)
    //   .subscribe(
    //     (postsSchemaMap) => {
    //       console.log(postsSchemaMap);
    //       this.spotPosts = [];
    //       for (let id in postsSchemaMap) {
    //         this.spotPosts.push(new Post.Class(id, postsSchemaMap[id]));
    //       }
    //     },
    //     (error) => {},
    //     () => {}
    //   );
  }

  unsubscribeFromSpotPosts() {
    if (!this.postSubscription) {
      return;
    }

    console.log("Unsubscribing...");
    this.postSubscription.unsubscribe();
  }

  openSpotReportDialog() {
    const spot = this.spot();
    if (!(spot instanceof Spot)) return;

    if (
      !this.authenticationService.isSignedIn ||
      !this.authenticationService.user.uid ||
      !this.authenticationService.user.data
    )
      return;

    const spotReportData: SpotReportSchema = {
      spot: {
        id: spot.id,
        name: spot.name(),
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
    const spot = this.spot();
    console.log(typeof Spot);
    if (!(spot instanceof Spot)) return;

    const uid = this.authenticationService.user.uid;
    const spotId = spot.id;

    if (!uid) {
      console.error("User not signed in, cannot open review dialog");
      return;
    }

    let isUpdate: boolean = false;
    let review: SpotReviewSchema | undefined;

    // TODO somehow show that we are loading the review

    // check if the user has already reviewed this spot
    this._spotReviewsService
      .getSpotReviewById(spotId, uid)
      .then((_review) => {
        review = _review;
        isUpdate = true;
      })
      .finally(() => {
        if (!spot) {
          console.warn("Spot has been unselected after opening review dialog");
          this.reviewDialog.closeAll();
          return;
        }
        if (!this.authenticationService.user.data?.displayName) {
          console.error("User data is missing, cannot open review dialog");
          return;
        }

        // don't throw an error if the review doesn't exist, create a new one

        if (!review) {
          review = {
            spot: {
              name: spot.name(),
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
