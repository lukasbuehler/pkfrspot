import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { Spot } from "../../db/models/Spot";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { SpotPreviewCardComponent } from "../spot-preview-card/spot-preview-card.component";
import { MatMiniFabButton, MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTabGroup, MatTab, MatTabLabel } from "@angular/material/tabs";

@Component({
  selector: "app-discover-spots-view",
  templateUrl: "./discover-spots-view.component.html",
  styleUrls: ["./discover-spots-view.component.scss"],
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatIcon,
    MatMiniFabButton,
    MatButton,
    SpotPreviewCardComponent,
    MatFormField,
    MatLabel,
    MatInput,
  ],
})
export class DiscoverSpotsViewComponent implements OnInit {
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  @Output() spotClick: EventEmitter<Spot.Spot> = new EventEmitter<Spot.Spot>();

  discoverSpots: Spot.Spot[] = [];

  constructor() {}

  ngOnInit(): void {}

  closeView() {
    this.close.emit();
  }

  spotClicked(spot) {
    this.spotClick.emit(spot);
  }

  discoverDistanceChipSelected(event) {
    console.log(event);
  }

  loadDiscoverSpots(location, radius) {
    //     return this._dbService.getTestSpots(true).subscribe((spots) => {
    //       this.discoverSpots = spots;
    //     });
  }
}
