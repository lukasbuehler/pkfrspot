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
import { Subscription } from "rxjs";
import { AuthenticationService } from "../authentication.service";
import { MediaType } from "src/scripts/db/Interfaces";

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

  @ViewChild(UploadMediaUiComponent) uploadMediaComp;

  backupSpot: Spot.Class;

  visited: boolean = false;

  spotTypes = Object.values(Spot.Types);
  spotAreas = Object.values(Spot.Areas);

  newSpotImage: File = null;

  spotPosts: Post.Class[] = [];
  postSubscription: Subscription;

  constructor(
    private _dbService: DatabaseService,
    private _storageService: StorageService,
    private _authenticationService: AuthenticationService
  ) {
    if (this.spot) {
      this.backupSpot = this.spot;
    }
  }

  ngOnInit() {}

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
    this.backupSpot = this.spot;
    if (this.editable && this._authenticationService.isSignedIn) {
      this.isEditing = true;
      this.isEditingChange.emit(true);
    }
  }
  saveButtonClick() {
    this.updatePaths();
    //this.isEditing = false;
    //this.save();
    //this.isEditingChange.emit(false);
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

  focusClick() {}

  rateClick() {}

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
    // If the spot does not have an ID, it does not exist in the database yet.
    if (this.spot.id) {
      // this is an old spot that is edited
      this._dbService.setSpot(this.spot.id, this.spot.data).subscribe(
        () => {
          // Successfully updated
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
}
