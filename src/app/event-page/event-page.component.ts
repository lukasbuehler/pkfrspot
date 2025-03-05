import {
  Component,
  inject,
  LOCALE_ID,
  afterNextRender,
  OnInit,
  ViewChild,
  signal,
  OnDestroy,
} from "@angular/core";
import { CountdownComponent } from "../countdown/countdown.component";
import { SpotMapComponent } from "../spot-map/spot-map.component";
import { LocationStrategy, NgOptimizedImage } from "@angular/common";
import { LocalSpot, Spot, SpotId } from "../../db/models/Spot";
import { SpotListComponent } from "../spot-list/spot-list.component";
import { SpotsService } from "../services/firebase/firestore/spots.service";
import {
  firstValueFrom,
  lastValueFrom,
  Subscription,
  take,
  timeout,
} from "rxjs";
import { LocaleCode } from "../../db/models/Interfaces";
import { MarkerComponent, MarkerSchema } from "../marker/marker.component";
import { MetaInfoService } from "../services/meta-info.service";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { SpotDetailsComponent } from "../spot-details/spot-details.component";
import { trigger, transition, style, animate } from "@angular/animations";
import { CodeBlockComponent } from "../code-block/code-block.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatChipsModule } from "@angular/material/chips";

@Component({
  selector: "app-event-page",
  imports: [
    CountdownComponent,
    SpotMapComponent,
    // NgOptimizedImage,
    // SpotListComponent,
    // MarkerComponent,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    // SpotDetailsComponent,
    MatMenuModule,
    MatChipsModule,
  ],
  animations: [
    trigger("fadeInOut", [
      transition(":enter", [
        style({ opacity: 0, scale: 0.8 }),
        animate("0.3s ease-out", style({ opacity: 1, scale: 1 })),
      ]),
      transition(":leave", [
        style({ opacity: 1, scale: 1 }),
        animate("0.3s ease-in", style({ opacity: 0, scale: 0.8 })),
      ]),
    ]),
  ],
  templateUrl: "./event-page.component.html",
  styleUrl: "./event-page.component.scss",
})
export class EventPageComponent implements OnInit, OnDestroy {
  @ViewChild("spotMap") spotMap: SpotMapComponent | undefined;

  metaInfoService = inject(MetaInfoService);
  locale = inject<LocaleCode>(LOCALE_ID);
  private _spotService = inject(SpotsService);
  private _route = inject(ActivatedRoute);
  private _locationStrategy = inject(LocationStrategy);
  private _snackbar = inject(MatSnackBar);

  private _routeSubscription: Subscription;

  selectedSpot = signal<Spot | LocalSpot | null>(null);

  showHeader = signal<boolean>(true);

  isEmbedded = false;

  eventId: string = "swissjam25";
  name: string = "Swiss Jam 2025";
  bannerImageSrc: string = "/assets/swissjam.jpg";
  localityString: string = "Zurich, Switzerland";
  start: Date = new Date("2025-05-24T09:00:00+01:00");
  end: Date = new Date("2025-05-25T16:00:00+01:00");
  readableStartDate: string = this.start.toLocaleDateString(this.locale, {
    dateStyle: "full",
  });
  readableEndDate: string = this.end.toLocaleDateString(this.locale, {
    dateStyle: "full",
  });

  private swissJamSpotIds: SpotId[] = [
    "yhRsQmaXABRQVrbtgQ7D" as SpotId,
    "23Oek5FVSThPbuG6MSjj" as SpotId,
    "EcI4adxBhMYZOXT8tPe3" as SpotId,
  ];

  markers: MarkerSchema[] = [
    // WC
    {
      name: $localize`WC`,
      color: "tertiary",
      location: {
        lat: 47.3971769023667,
        lng: 8.549297630031907,
      },
      icon: "wc",
    },

    // Workshop 1
    {
      name: `Workshop 1`,
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
      name: $localize`Info stand`,
      color: "primary",
      location: {
        lat: 47.397277939269756,
        lng: 8.548552088730592,
      },
      icon: "info",
    },
  ];

  spots = signal<Spot[]>([]);

  mapStyle: "roadmap" | "satellite" = "satellite";

  constructor() {
    this._routeSubscription = this._route.queryParams.subscribe((params) => {
      if (params["showHeader"]) {
        this.showHeader.set(params["showHeader"] === "true");
      }

      // if (params["mapStyle"]) {
      //   this.mapStyle = params["mapStyle"];
      // }
    });

    firstValueFrom(this._route.data.pipe(take(1))).then((data) => {
      if (data["routeName"].toLowerCase().includes("embed")) {
        this.isEmbedded = true;
      }
    });

    afterNextRender(() => {
      const promises = this.swissJamSpotIds.map((spotId) => {
        return firstValueFrom(
          this._spotService.getSpotById$(spotId, this.locale)
        );
      });

      Promise.all(promises).then((spots) => {
        this.spots.set(spots);
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

  spotClickedIndex(spotIndex: number) {
    this.selectedSpot.set(this.spots()[spotIndex]);
  }

  ngOnDestroy() {
    if (this._routeSubscription) {
      this._routeSubscription.unsubscribe();
    }
  }

  async shareEvent() {
    const url = "https://pkfrspot.com";
    const baseUrl = this._locationStrategy.getBaseHref();

    // TODO use slug instead of id if available

    const link = url + "/events/" + this.eventId;

    if (navigator["share"]) {
      try {
        const shareData = {
          title: this.name,
          text: `PKFR Spot: ${this.name}`,
          url: link,
        };

        await navigator["share"](shareData);
      } catch (err) {
        console.error("Couldn't share this spot");
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(`${this.name} - PKFR Spot \n${link}`);
      this._snackbar.open("Link to spot copied to clipboard", "Dismiss", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "top",
      });
    }
  }
}
