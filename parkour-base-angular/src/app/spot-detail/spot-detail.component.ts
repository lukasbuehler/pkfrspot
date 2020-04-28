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

@Component({
  selector: "app-spot-detail",
  templateUrl: "./spot-detail.component.html",
  styleUrls: ["./spot-detail.component.scss"],
})
export class SpotDetailComponent implements OnInit {
  @Input() spot: Spot.Class;
  @Input() infoOnly: boolean = false;
  @Input() dismissable: boolean = false;
  @Input() flat: boolean = false;
  @Input() clickable: boolean = false;
  @Input() editable: boolean = false;
  @Input() isEditing: boolean = false;

  @Output() isEditingChange: EventEmitter<boolean> = new EventEmitter<
    boolean
  >();
  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() addBoundsClick: EventEmitter<void> = new EventEmitter<void>();

  backupSpotData: Spot.Schema;

  spotTypes = Object.values(Spot.Types);
  spotAreas = Object.values(Spot.Areas);

  constructor(private _dbService: DatabaseService) {
    if (this.spot) {
      this.backupSpotData = this.spot.data;
    }
  }

  ngOnInit() {}

  dismissed() {
    if (this.dismissable) {
      this.isEditing = false;
      this.isEditingChange.emit(false);

      this.dismiss.emit(true);
    }
  }

  editButtonClick() {
    if (this.editable) {
      this.isEditing = true;
      this.isEditingChange.emit(true);
    }
  }
  saveButtonClick() {
    this.isEditing = false;
    this.save();
    this.isEditingChange.emit(false);
  }
  discardButtonClikc() {
    this.isEditing = false;
    this.isEditingChange.emit(false);
    this.spot.data = this.backupSpotData;
  }

  addBoundsClicked() {
    if (!this.isEditing) {
      this.isEditing = true;
      this.isEditingChange.emit(true);
    }
    this.addBoundsClick.emit();
  }

  focusClick() {}

  async shareSpot() {
    let baseUrl = "localhost:4200";

    let link = baseUrl + "/map/" + this.spot.id;

    if (navigator["share"]) {
      try {
        const shareData = {
          title: "Spot: " + this.spot.data.name,
          text: `Parkour Base Spot: ${this.spot.data.name}`,
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
    return this.spot.paths.length > 0;
  }

  save() {
    if (this.spot.id) {
      // this is an old spot that is edited
      this._dbService.setSpot(this.spot).subscribe(
        () => {
          console.log("Successful save!");
        },
        (error) => {
          console.error("Error on spot save", error);
        }
      );
    } else {
      // this is a new spot
      this._dbService.createSpot(this.spot).subscribe(
        () => {
          console.log("Successful spot creation");
        },
        (error) => {
          console.error("There was an error creating this spot!");
        }
      );
    }
  }

  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }
}
