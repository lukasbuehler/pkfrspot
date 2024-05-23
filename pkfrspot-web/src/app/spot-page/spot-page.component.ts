import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from "@angular/core";
import { MatProgressBar } from "@angular/material/progress-bar";
import { Spot } from "src/scripts/db/Spot";
import { DatabaseService } from "../database.service";
import { UploadMediaUiComponent } from "../upload-media-ui/upload-media-ui.component";
import { StorageService, StorageFolder } from "../storage.service";
import { Post } from "src/scripts/db/Post";
import { Observable, Subscription } from "rxjs";
import { AuthenticationService } from "../authentication.service";
import { MediaType } from "src/scripts/db/Interfaces";
import SwiperCore, { Navigation, Pagination } from "swiper";
SwiperCore.use([Navigation, Pagination]);
//import { MatTooltipModule } from "@angular/material/tooltip";

import {
  isoCountryCodeToFlagEmoji,
  getCountryNameInLanguage,
  getCountriesList,
  isMobileDevice,
} from "../../scripts/Helpers";
import { UntypedFormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { map, startWith } from "rxjs/operators";
import { MapsApiService } from "../maps-api.service";
import { MatAutocompleteTrigger, MatAutocomplete } from "@angular/material/autocomplete";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatSelect } from "@angular/material/select";
import { MediaPreviewGridComponent } from "../media-preview-grid/media-preview-grid.component";
import { PostCollectionComponent } from "../post-collection/post-collection.component";
import { MatTooltip } from "@angular/material/tooltip";
import { MatTabGroup, MatTab } from "@angular/material/tabs";
import { RatingComponent } from "../rating/rating.component";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel, MatHint } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton, MatButton } from "@angular/material/button";
import { MatRipple, MatOption } from "@angular/material/core";
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions } from "@angular/material/card";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { NgIf, NgFor, AsyncPipe } from "@angular/common";

@Component({
    selector: "app-spot-page",
    templateUrl: "./spot-page.component.html",
    styleUrls: ["./spot-page.component.scss"],
    standalone: true,
    imports: [
        NgIf,
        MatProgressBar,
        MatMenu,
        MatMenuItem,
        MatCard,
        MatRipple,
        MatCardHeader,
        MatCardTitle,
        MatIconButton,
        MatIcon,
        FormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        MatCardSubtitle,
        RatingComponent,
        MatCardContent,
        MatTabGroup,
        MatTab,
        MatButton,
        MatMenuTrigger,
        NgFor,
        MatTooltip,
        PostCollectionComponent,
        MediaPreviewGridComponent,
        UploadMediaUiComponent,
        MatSelect,
        MatOption,
        MatSlideToggle,
        MatAutocompleteTrigger,
        ReactiveFormsModule,
        MatAutocomplete,
        MatHint,
        MatCardActions,
        AsyncPipe,
    ],
})
export class SpotPageComponent implements OnInit {
  @Input() spot: Spot.Class;
  @Input() infoOnly: boolean = false;
  @Input() dismissable: boolean = false;
  @Input() flat: boolean = false;
  @Input() clickable: boolean = false;
  @Input() editable: boolean = false;
  @Input() isEditing: boolean = false;
  @Output() updateSpotEvent = new EventEmitter<void>();

  @Output()
  isEditingChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() addBoundsClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() focusClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() saveClick: EventEmitter<Spot.Class> =
    new EventEmitter<Spot.Class>();

  @ViewChild(UploadMediaUiComponent) uploadMediaComp;

  editedSpot: Spot.Class = null;

  spotLanguage: string = "de_CH";

  isSaving: boolean = false;

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

  automaticallyDetermineAddress: boolean = true;

  get isNewSpot() {
    return this.spot && !this.spot.id;
  }

  constructor(
    private _dbService: DatabaseService,
    private _storageService: StorageService,
    private _authenticationService: AuthenticationService,
    private _mapsApiService: MapsApiService
  ) {
    this.filteredCountries = this.stateCtrl.valueChanges.pipe(
      startWith(""),
      map((country) =>
        country ? this._filterCountries(country) : this.countries.slice()
      )
    );
  }

  ngOnInit() {
    this.countries = getCountriesList("de");
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

  countryOptionSelected(event) {
    let selectedCountryLong = event.option.value;

    let index = this.countries.findIndex(
      (val) => val.name === selectedCountryLong
    );

    if (!this.spot.address) {
      this.spot.address = {
        country: {
          long: selectedCountryLong,
          short: this.countries[index].code,
        },
        formatted: "",
      };
    } else {
      if (!this.spot.address.country) {
        this.spot.address.country = {
          long: selectedCountryLong,
          short: this.countries[index].code,
        };
      } else {
        this.spot.address.country.long = selectedCountryLong;
        this.spot.address.country.short = this.countries[index].code;
      }
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
    if (this.editable && this._authenticationService.isSignedIn) {
      this.isEditing = true;
      this.isEditingChange.emit(true);
    }
  }
  saveButtonClick() {
    this.isSaving = true;

    this.updateSpot();

    this.saveClick.emit(this.editedSpot);
    this.isEditingChange.emit(false);
  }
  discardButtonClick() {
    this.isEditing = false;
    this.isEditingChange.emit(false);

    if (this.isNewSpot) {
      // close the compact view as well
      this.dismissed();
    }
  }

  addBoundsClicked() {
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
              this._dbService,
              imageLink,
              MediaType.Image,
              this._authenticationService.user.uid
            );
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
    this.spot.setMedia(newSpotMedia, this._dbService, this._storageService);
  }

  private updateSpot() {
    this.updateSpotEvent.emit();
  }

  async shareSpot() {
    let baseUrl = "https://pkfrspot.com";

    let link = baseUrl + "/map?spot=" + this.spot.id;

    if (navigator["share"]) {
      try {
        const shareData = {
          title: "Spot: " + this.spot.name,
          text: `PKFR Spot: ${this.spot.name}`,
          url: link,
        };

        await navigator["share"](shareData);
      } catch (err) {
        console.error("Couldn't share this spot");
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(link);
      console.log("copied to clipboard");
      // TODO Snackbar
    }
  }

  openSpotInMaps() {
    this._mapsApiService.openLatLngInGoogleMaps(this.spot.location);
  }

  hasBounds() {
    return this.spot && this.spot.hasBounds();
  }

  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }

  loadSpotPosts() {
    console.log("Loading posts");
    this.postSubscription = this._dbService
      .getPostsFromSpot(this.spot)
      .subscribe(
        (postsSchemaMap) => {
          console.log("postsSchemaMap", postsSchemaMap);
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
}
