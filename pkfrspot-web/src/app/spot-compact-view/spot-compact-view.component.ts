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
import { UntypedFormControl } from "@angular/forms";
import { Renderer2, AfterViewInit } from "@angular/core";
import { map, startWith } from "rxjs/operators";
import { trigger, transition, style, animate } from "@angular/animations";
import { MapsApiService } from "../maps-api.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-spot-compact-view",
  templateUrl: "./spot-compact-view.component.html",
  styleUrls: ["./spot-compact-view.component.scss"],
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
})
export class SpotCompactViewComponent
  implements OnInit, OnChanges, AfterViewInit
{
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

  startHeight: number = 0;

  @HostBinding("@grow") get grow() {
    return { value: this.spot, params: { startHeight: this.startHeight } };
  }

  constructor(
    private renderer: Renderer2,
    public authenticationService: AuthenticationService,
    private _element: ElementRef,
    private _dbService: DatabaseService,
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

  ngOnChanges() {
    //console.log(this._element.nativeElement.clientHeight);

    this.startHeight = this._element.nativeElement.clientHeight;
  }

  ngOnInit() {
    this.countries = getCountriesList("de");
  }

  ngAfterViewInit() {
    const swiperContainer = document.querySelector("swiper-container");
    if (swiperContainer) {
      this.renderer.listen(swiperContainer, "touchstart", (event) => {
        event.stopPropagation();
      });
      this.renderer.listen(swiperContainer, "touchmove", (event) => {
        event.stopPropagation();
      });
    }
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
      this.spot.address = this.spot.address;
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
              this._dbService,
              imageLink,
              MediaType.Image,
              this.authenticationService.user.uid
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

  async shareSpot() {
    let baseUrl = "https://pkfrspot.com";

    let link = baseUrl + "/map/" + this.spot.id;

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
      this._snackbar.open("Link to spot copied to clipboard", "Dismiss", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "top",
      });
    }
  }

  openSpotInMaps() {
    this._mapsApiService.openInGoogleMapsInNewTab(this.spot.location);
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
}
