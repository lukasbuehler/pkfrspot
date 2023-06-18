import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { Spot } from "src/scripts/db/Spot";
import { DatabaseService } from "../database.service";

@Component({
  selector: "app-discover-spots-view",
  templateUrl: "./discover-spots-view.component.html",
  styleUrls: ["./discover-spots-view.component.scss"],
})
export class DiscoverSpotsViewComponent implements OnInit {
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  @Output() spotClick: EventEmitter<Spot.Class> =
    new EventEmitter<Spot.Class>();

  discoverSpots: Spot.Class[] = [];

  constructor(private _dbService: DatabaseService) {}

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
    return this._dbService.getTestSpots(true).subscribe((spots) => {
      this.discoverSpots = spots;
    });
  }
}
