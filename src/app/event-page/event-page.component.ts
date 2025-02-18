import {
  Component,
  inject,
  LOCALE_ID,
  afterNextRender,
  OnInit,
} from "@angular/core";
import { CountdownComponent } from "../countdown/countdown.component";
import { SpotMapComponent } from "../spot-map/spot-map.component";
import { NgOptimizedImage } from "@angular/common";
import { Spot, SpotId } from "../../db/models/Spot";
import { SpotListComponent } from "../spot-list/spot-list.component";
import { SpotsService } from "../services/firebase/firestore/spots.service";
import { firstValueFrom, lastValueFrom, take, timeout } from "rxjs";
import { LocaleCode } from "../../db/models/Interfaces";
import { MarkerSchema } from "../marker/marker.component";
import { MetaInfoService } from "../services/meta-info.service";

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
export class EventPageComponent implements OnInit {
  metaInfoService = inject(MetaInfoService);
  locale = inject<LocaleCode>(LOCALE_ID);
  private _spotService = inject(SpotsService);

  name: string = "Swiss Jam 2025";
  bannerImageSrc: string = "/assets/swissjam.jpg";
  localityString: string = "Zurich, Switzerland";
  start: Date = new Date("2025-05-24T09:00:00+01:00");
  end: Date = new Date("2025-05-25T16:00:00+01:00");

  private swissJamSpotIds: SpotId[] = [
    "yhRsQmaXABRQVrbtgQ7D" as SpotId,
    "23Oek5FVSThPbuG6MSjj" as SpotId,
    "EcI4adxBhMYZOXT8tPe3" as SpotId,
  ];

  markers: MarkerSchema[] = [
    // WC
    {
      name: "WC",
      color: "tertiary",
      location: {
        lat: 47.3971769023667,
        lng: 8.549297630031907,
      },
      icon: "wc",
    },

    // Workshop 1
    {
      name: "Workshop 1",
      color: "secondary",
      location: {
        lat: 47.39723208524732,
        lng: 8.547745381467138,
      },
      icon: "diversity_3",
    },

    // // Workshop 2
    // {
    //   name: "Workshop 2",
    //   color: "secondary",
    //   location: {
    //     lat: 47.39736800362042,
    //     lng: 8.54858267174903,
    //   },
    //   icon: "diversity_3",
    // },
    // Info
    {
      name: "Info",
      color: "primary",
      location: {
        lat: 47.397277939269756,
        lng: 8.548552088730592,
      },
      icon: "info",
    },
  ];

  spots: Spot[] = [];

  mapStyle: "roadmap" | "satellite" = "satellite";

  constructor() {
    afterNextRender(() => {
      this.swissJamSpotIds.forEach((spotId) => {
        firstValueFrom(
          this._spotService.getSpotById$(spotId, this.locale)
        ).then((spot) => {
          this.spots.push(spot);
        });
      });
    });
  }

  ngOnInit() {
    this.metaInfoService.setMetaTags(
      this.name, //+ " | PKFR Spot",
      this.bannerImageSrc,
      $localize`Event in ` +
        this.localityString +
        ", (" +
        (this.start.toLocaleDateString() === this.end.toLocaleDateString()
          ? this.start.toLocaleDateString()
          : this.start.toLocaleDateString() +
            " - " +
            this.end.toLocaleDateString()) +
        ")"
    );
  }
}
