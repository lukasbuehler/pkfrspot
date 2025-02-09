import { Component, afterNextRender } from "@angular/core";
import { CountdownComponent } from "../countdown/countdown.component";
import { SpotMapComponent } from "../spot-map/spot-map.component";
import { NgOptimizedImage } from "@angular/common";
import { Spot, SpotId } from "../../scripts/db/Spot";
import { SpotListComponent } from "../spot-list/spot-list.component";
import { SpotsService } from "../services/firestore-services/spots.service";
import { lastValueFrom, take, timeout } from "rxjs";

@Component({
  selector: "app-event-page",
  imports: [
    CountdownComponent,
    SpotMapComponent,
    NgOptimizedImage,
    SpotListComponent,
  ],
  templateUrl: "./event-page.component.html",
  styleUrl: "./event-page.component.scss",
})
export class EventPageComponent {
  name: string = "Swiss Jam 2025";
  start: Date = new Date("2025-05-24T09:00:00+01:00");
  end: Date = new Date("2025-05-25T16:00:00+01:00");

  private swissJamSpotIds: SpotId[] = [
    "yhRsQmaXABRQVrbtgQ7D" as SpotId,
    "23Oek5FVSThPbuG6MSjj" as SpotId,
    "EcI4adxBhMYZOXT8tPe3" as SpotId,
  ];

  spots: Spot.Class[] = [];

  constructor(private _spotService: SpotsService) {
    afterNextRender(() => {
      this.swissJamSpotIds.forEach((spotId) => {
        this._spotService
          .getSpotById$(spotId)
          .pipe(take(1), timeout(10000))
          .subscribe((spot) => {
            this.spots.push(spot);
          });
      });
    });
  }
}
