import {
  Component,
  inject,
  LOCALE_ID,
  afterNextRender,
  OnInit,
  ViewChild,
  signal,
  OnDestroy,
  AfterViewInit,
} from "@angular/core";
import { CountdownComponent } from "../countdown/countdown.component";
import { SpotMapComponent } from "../spot-map/spot-map.component";
import { LocationStrategy, NgOptimizedImage } from "@angular/common";
import { LocalSpot, Spot, SpotId } from "../../db/models/Spot";
import { SpotListComponent } from "../spot-list/spot-list.component";
import { SpotsService } from "../services/firebase/firestore/spots.service";
import {
  filter,
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
import { MapsApiService } from "../services/maps-api.service";
import { PolygonSchema } from "../../db/schemas/PolygonSchema";

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
  private _mapsApiService = inject(MapsApiService);

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

  areaPolygon = signal<PolygonSchema | null>(null);

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
      name: `Challenge 1`,
      color: "secondary",
      location: {
        lat: 47.39723208524732,
        lng: 8.547745381467138,
      },
      icon: "diversity_3",
      number: 1,
    },

    // Workshop 2
    {
      name: "Challenge 2",
      color: "secondary",
      location: {
        lat: 47.39736800362042,
        lng: 8.54858267174903,
      },
      icon: "person",
      number: 2,
    },
    // Info
    {
      name: $localize`Info stand`,
      color: "primary",
      location: {
        lat: 47.397277939269756,
        lng: 8.548552088730592,
      },
      icon: "info",
      priority: "required",
    },

    // Tram stations
    {
      name: "Milchbuck",
      color: "tertiary",
      location: {
        lat: 47.39778445846257,
        lng: 8.541912684696003,
      },
      icon: "tram",
    },
    {
      name: "Universität Irchel",
      color: "tertiary",
      location: {
        lat: 47.39606604052732,
        lng: 8.544833096010917,
      },
      icon: "tram",
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
      this.name,
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

    firstValueFrom(
      this._mapsApiService.isApiLoaded$.pipe(
        filter((isLoaded) => isLoaded),
        take(1)
      )
    ).then(() => {
      this.areaPolygon.set({
        paths: new google.maps.MVCArray<
          google.maps.MVCArray<google.maps.LatLng>
        >([
          new google.maps.MVCArray<google.maps.LatLng>([
            new google.maps.LatLng(0, -90),
            new google.maps.LatLng(0, 90),
            new google.maps.LatLng(90, -90),
            new google.maps.LatLng(90, 90),
          ]),
          new google.maps.MVCArray<google.maps.LatLng>([
            new google.maps.LatLng(47.39690440489847, 8.54137955373239),
            new google.maps.LatLng(47.39922912784592, 8.54270958874722),
            new google.maps.LatLng(47.39976970395402, 8.546988087725437),
            new google.maps.LatLng(47.39852765134482, 8.552592984179212),
            new google.maps.LatLng(47.39266322242201, 8.550449664195357),
            new google.maps.LatLng(47.395861761732796, 8.546175461394029),
          ]),
        ]),
        strokeOpacity: 0,
        strokeWeight: 0,
        fillColor: "#000000",
        fillOpacity: 0.5,
      });
    });

    // add the structured data for the event
    const structuredDataJson = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: this.name,
      startDate: this.start.toISOString(),
      endDate: this.end.toISOString(),
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: "Universität Irchel",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Zürich",
          postalCode: "8057",
          streetAddress:
            "Universitätscampus Irchel, Winterthurerstrasse 190, Zürich, CH",
        },
      },
      image: [this.bannerImageSrc],
      description:
        "The Swiss Jam 2025 invites the whole Parkour community to Zurich.\n" +
        "The main event area is located at the Irchepark. Different workshops for all skill levels can be joined. A big spot with major extensions gives enough room for all kind of movements and inspirations. A big Video-Screeing shows our communitys creativity.\n" +
        "Join the event to jam, to learn, to get inspired and inspire!",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "CHF",
        highPrice: "29.90",
        lowPrice: "14.90",
        offerCount: "3",
        offers: [
          {
            "@type": "Offer",
            name: "All Workshops",
            price: "29.90",
            priceCurrency: "CHF",
          },
          {
            "@type": "Offer",
            name: "2x Workshops",
            price: "24.90",
            priceCurrency: "CHF",
          },
          {
            "@type": "Offer",
            name: "1x Workshops",
            price: "14.90",
            priceCurrency: "CHF",
          },
        ],
        url: "https://eventfrog.ch/de/p/sport-fitness/sonstige-veranstaltungen/swiss-jam-2025-7291100335594076233.html",
      },
      organizer: {
        "@type": "Organization",
        name: "Swiss Parkour Tour",
        url: "https://www.swissparkourtour.ch/",
        memberOf: {
          "@type": "Organization",
          name: "Swiss Parkour Association",
          url: "https://spka.ch",
        },
      },
      url: "https://www.swissparkourtour.ch/swiss-jam-2025/",
    };

    if (typeof document !== "undefined") {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredDataJson);
      document.body.appendChild(script);
    }
  }

  spotClickedIndex(spotIndex: number) {
    this.selectedSpot.set(this.spots()[spotIndex]);
  }

  ngOnDestroy() {
    if (this._routeSubscription) {
      this._routeSubscription.unsubscribe();
    }

    // remove the event structured data element
    if (typeof document !== "undefined") {
      const script = document.querySelector(
        'script[type="application/ld+json"]'
      );
      if (script) {
        script.remove();
      }
    }
  }

  async shareEvent() {
    const url = "https://pkspot.app";
    const baseUrl = this._locationStrategy.getBaseHref();

    // TODO use slug instead of id if available

    const link = url + "/events/" + this.eventId;

    if (navigator["share"]) {
      try {
        const shareData = {
          title: this.name,
          text: `PK Spot: ${this.name}`,
          url: link,
        };

        await navigator["share"](shareData);
      } catch (err) {
        console.error("Couldn't share this spot");
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(`${this.name} - PK Spot \n${link}`);
      this._snackbar.open("Link to spot copied to clipboard", "Dismiss", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "top",
      });
    }
  }
}
