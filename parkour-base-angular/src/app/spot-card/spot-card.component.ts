import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Spot } from "src/scripts/db/Spot";

@Component({
  selector: "app-spot-card",
  templateUrl: "./spot-card.component.html",
  styleUrls: ["./spot-card.component.scss"]
})
export class SpotCardComponent implements OnInit {
  @Input() spot: Spot.Class;
  @Input() preview: boolean = false;
  @Input() dismissable: boolean = false;
  @Input() flat: boolean = false;
  @Input() clickable: boolean = false;

  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  dismissed() {
    this.dismiss.emit(true);
  }

  editRequested() {
    this.edit.emit();
  }

  async shareSpot() {
    let baseUrl = "localhost:4200";

    let link = baseUrl + "/map/" + this.spot.id;

    if (navigator["share"]) {
      try {
        const shareData = {
          title: "Spot: " + this.spot.data.name,
          text: `Parkour Base Spot: ${this.spot.data.name} (${this.spot.data.type}) at ${this.spot.data.address}`,
          url: link
        };

        await navigator["share"](shareData);
      } catch (err) {
        console.error("Couldn't share this spot");
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(link);
      console.log("copied to clipboard");
    }
  }
}
