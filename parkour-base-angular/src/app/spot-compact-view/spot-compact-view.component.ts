import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from "@angular/core";
import { Spot } from "src/scripts/db/Spot";
import { DatabaseService } from "../database.service";
import { UploadMediaUiComponent } from "../upload-media-ui/upload-media-ui.component";
import { StorageService, StorageFolder } from "../storage.service";
import { Post } from "src/scripts/db/Post";
import { Observable, Subscription } from "rxjs";
import { AuthenticationService } from "../authentication.service";
import { MediaType } from "src/scripts/db/Interfaces";
//import { MatTooltipModule } from "@angular/material/tooltip";

import {
  isoCountryCodeToFlagEmoji,
  getCountryNameInLanguage,
  getCountriesList,
} from "../../scripts/Helpers";
import { FormControl } from "@angular/forms";
import { map, startWith } from "rxjs/operators";

@Component({
  selector: "app-spot-compact-view",
  templateUrl: "./spot-compact-view.component.html",
  styleUrls: ["./spot-compact-view.component.scss"],
})
export class SpotCompactViewComponent implements OnInit {
  @Input() spot: Spot.Class;
  @Input() infoOnly: boolean = false;
  @Input() dismissable: boolean = false;
  @Input() flat: boolean = false;
  @Input() clickable: boolean = false;
  @Input() editable: boolean = false;
  @Input() isEditing: boolean = false;
  @Output() callGetPathsPromiseFunction = new EventEmitter<void>();

  @Output()
  isEditingChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() addBoundsClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() focusClick: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild(UploadMediaUiComponent) uploadMediaComp;

  backupSpot: Spot.Class = null;

  visited: boolean = false;
  bookmarked: boolean = false;

  spotTypes = Object.values(Spot.Types);
  spotAreas = Object.values(Spot.Areas);

  newSpotImage: File = null;

  spotPosts: Post.Class[] = [];
  postSubscription: Subscription;

  countries: any[] = [];
  filteredCountries: Observable<any[]>;
  stateCtrl = new FormControl();

  constructor(
    private _dbService: DatabaseService,
    private _storageService: StorageService,
    private _authenticationService: AuthenticationService
  ) {
    if (this.spot) {
      this.backupSpot = JSON.parse(JSON.stringify(this.spot));
    }

    this.filteredCountries = this.stateCtrl.valueChanges.pipe(
      startWith(""),
      map((country) =>
        country ? this._filterCountries(country) : this.countries.slice()
      )
    );
  }

  private _filterCountries(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.countries.filter(
      (country) => country.name.toLowerCase().indexOf(filterValue) === 0
    );
  }

  ngOnInit() {
    this.countries = getCountriesList("de");
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
      this.spot.setAddress({
        country: {
          long: selectedCountryLong,
          short: this.countries[index].code,
        },
        formatted: "",
      });
    } else {
      this.spot.address.country.long = selectedCountryLong;
      this.spot.address.country.short = this.countries[index].code;

      this.spot.setAddress(this.spot.address);
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
    this.backupSpot = this.spot;
    if (this.editable && this._authenticationService.isSignedIn) {
      this.isEditing = true;
      this.isEditingChange.emit(true);
    }
  }
  saveButtonClick() {
    this.updatePaths();
    this.save();
    this.isEditingChange.emit(false);
  }
  discardButtonClick() {
    this.isEditing = false;
    this.isEditingChange.emit(false);
    this.spot = this.backupSpot;
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
    if (this.uploadMediaComp.isImageSelected()) {
      this.newSpotImage = file;
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

        observable.subscribe(
          (imageLink) => {
            this.spot.addMedia(
              imageLink,
              MediaType.Image,
              this._authenticationService.uid
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

  private updatePaths() {
    this.callGetPathsPromiseFunction.emit();
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
      console.log("copied to clipboard");
      // TODO Snackbar
    }
  }

  hasBounds() {
    return this.spot && this.spot.hasBounds();
  }

  public save() {
    console.log("saving the spot");
    console.log(this.spot.data);
    // If the spot does not have an ID, it does not exist in the database yet.
    if (this.spot.id) {
      // this is an old spot that is edited
      this._dbService.setSpot(this.spot.id, this.spot.data).subscribe(
        () => {
          // Successfully updated
          this.isEditing = false;
          // TODO Snackbar or something
        },
        (error) => {
          console.error("Error on spot save", error);
        }
      );
    } else {
      // this is a new spot
      this._dbService.createSpot(this.spot.data).subscribe(
        (id) => {
          // Successfully created
          this.isEditing = false;
          // TODO snackbar or something
        },
        (error) => {
          console.error("There was an error creating this spot!", error);
        }
      );
    }
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
    console.log("Unsubscribing...");
    this.postSubscription.unsubscribe();
  }

  getCountryNameFromShortCode(shortCountryCode) {
    return getCountryNameInLanguage(shortCountryCode);
  }

  getCountryEmojiFromAlpha2(countryAlpha2Code) {
    return isoCountryCodeToFlagEmoji(countryAlpha2Code);
  }
}
