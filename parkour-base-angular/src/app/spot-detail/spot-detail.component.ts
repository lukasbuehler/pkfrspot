import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from "@angular/core";
import { Spot } from "src/scripts/db/Spot";

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

  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() editBounds: EventEmitter<any> = new EventEmitter<any>();

  editingDetails: boolean = false;

  spotTypes = Object.values(Spot.Types);
  spotAreas = Object.values(Spot.Areas);

  constructor() {}

  ngOnInit() {}

  dismissed() {
    if (this.dismissable) {
      this.dismiss.emit(true);
    }
  }

  editDetailsClick() {
    if (this.editable) {
      if (!this.editingDetails) {
        // edit
        this.editingDetails = true;
      } else {
        // save
        this.editingDetails = false;
      }
    }
  }

  editBoundsClick() {
    if (this.editable) {
      this.editBounds.emit();
    }
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

  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }
}
