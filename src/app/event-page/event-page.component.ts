import { Component, AfterViewInit } from "@angular/core";
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
export class EventPageComponent implements AfterViewInit {
  name: string = "Swiss Jam 2025";
  start: Date = new Date("2025-05-17T09:00:00+01:00");

  private swissJamSpotIds: SpotId[] = [
    "yhRsQmaXABRQVrbtgQ7D" as SpotId,
    "23Oek5FVSThPbuG6MSjj" as SpotId,
    "EcI4adxBhMYZOXT8tPe3" as SpotId,
  ];

  spots: Spot.Class[] = [];

  constructor(private _spotService: SpotsService) {}

  async ngAfterViewInit() {
    this.spots = await Promise.all(
      this.swissJamSpotIds.map(async (spotId) => {
        return await lastValueFrom(
          this._spotService.getSpotById(spotId).pipe(take(1), timeout(10000))
        );
      })
    );
  }
}
