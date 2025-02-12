import {
  Component,
  ViewChild,
  AfterViewInit,
  OnInit,
  Inject,
  PLATFORM_ID,
  LOCALE_ID,
} from "@angular/core";
import { SpotPreviewData } from "../../db/schemas/SpotPreviewData";
import { LocalSpot, Spot, SpotId } from "../../db/models/Spot";
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
} from "@angular/router";
import { SpeedDialFabButtonConfig } from "../speed-dial-fab/speed-dial-fab.component";
import { AuthenticationService } from "../services/firebase/authentication.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MapsApiService } from "../services/maps-api.service";
import { BehaviorSubject, filter, firstValueFrom, take, timeout } from "rxjs";
import { animate, style, transition, trigger } from "@angular/animations";
import { BottomSheetComponent } from "../bottom-sheet/bottom-sheet.component";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SearchService } from "../services/search.service";
import { SearchResponse } from "typesense/lib/Typesense/Documents";
import { SpotMapComponent } from "../spot-map/spot-map.component";
import {
  Location,
  NgIf,
  NgFor,
  AsyncPipe,
  isPlatformServer,
} from "@angular/common";
import { StorageService } from "../services/firebase/storage.service";
import { GlobalVariables } from "../../scripts/global";
import { SpotListComponent } from "../spot-list/spot-list.component";
import { SpotsService } from "../services/firebase/firestore/spots.service";
// import { UserMenuContentComponent } from "../user-menu-content/user-menu-content.component";
import { SpotDetailsComponent } from "../spot-details/spot-details.component";
import { MatOption } from "@angular/material/core";
import {
  MatAutocompleteTrigger,
  MatAutocomplete,
} from "@angular/material/autocomplete";
import { MatInput } from "@angular/material/input";
import { MatIconModule, MatIcon } from "@angular/material/icon";
import { MatMenuTrigger, MatMenu } from "@angular/material/menu";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatFormField, MatSuffix } from "@angular/material/form-field";
import { Title } from "@angular/platform-browser";
import { MatDividerModule } from "@angular/material/divider";
import { LocaleCode, SpotSlug } from "../../db/models/Interfaces";
import { SlugsService } from "../services/firebase/firestore/slugs.service";
import { MetaInfoService } from "../services/meta-info.service";

@Component({
  selector: "app-map-page",
  templateUrl: "./map-page.component.html",
  styleUrls: ["./map-page.component.scss"],
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
  imports: [
    SpotMapComponent,
    MatFormField,
    MatIconButton,
    MatButtonModule,
    MatSuffix,
    MatIconModule,
    MatIcon,
    MatInput,
    FormsModule,
    MatAutocompleteTrigger,
    ReactiveFormsModule,
    MatAutocomplete,
    NgFor,
    MatOption,
    SpotDetailsComponent,
    SpotListComponent,
    BottomSheetComponent,
    // UserMenuContentComponent,
    AsyncPipe,
    MatDividerModule,
  ],
})
export class MapPageComponent implements OnInit, AfterViewInit {
  @ViewChild("spotMap", { static: false }) spotMap: SpotMapComponent | null =
    null;
  @ViewChild("bottomSheet") bottomSheet: BottomSheetComponent | undefined;

  selectedSpot: Spot | LocalSpot | null = null;
  isEditing: boolean = false;
  mapStyle: "roadmap" | "satellite" = "roadmap";

  askedGeoPermission: boolean = false;
  hasGeolocation: boolean = false;

  visibleSpots: Spot[] = [];
  highlightedSpots: SpotPreviewData[] = [];

  spotSearchControl = new FormControl();
  spotAndPlaceSearchResults$ = new BehaviorSubject<{
    places: google.maps.places.AutocompletePrediction[] | null;
    spots: SearchResponse<any> | null;
  } | null>(null);

  alainMode: boolean = false;

  isServer: boolean;

  constructor(
    @Inject(LOCALE_ID) public locale: LocaleCode,
    @Inject(PLATFORM_ID) platformId: Object,
    public route: ActivatedRoute,
    public authService: AuthenticationService,
    public mapsService: MapsApiService,
    public storageService: StorageService,
    private metaInfoService: MetaInfoService,
    private _spotsService: SpotsService,
    private _searchService: SearchService,
    private _slugsService: SlugsService,
    private router: Router,
    private location: Location,
    private _snackbar: MatSnackBar,
    private titleService: Title
  ) {
    GlobalVariables.alainMode.subscribe((value) => {
      this.alainMode = value;
    });

    this.isServer = isPlatformServer(platformId);

    this.titleService.setTitle($localize`:@@pkfr.spotmap.title:PKFR Spot map`);
  }

  // Speed dial FAB //////////////////////////////////////////////////////////

  speedDialButtonConfig: SpeedDialFabButtonConfig = {
    mainButton: {
      icon: "add_location",
      tooltip: "Create a new spot",
      color: "accent",
    },
    miniButtonColor: "primary",
    miniButtons: [
      {
        icon: "note_add",
        tooltip: "Import Spots from a KML file",
      },
    ],
  };

  setVisibleSpots(spots: Spot[], mapCenter: google.maps.LatLngLiteral) {
    if (!spots || !mapCenter) return;
    spots.sort((a, b) => {
      return (
        Math.sqrt(a.location().lat ** 2 + a.location().lng ** 2) -
        Math.sqrt(mapCenter.lat ** 2 + mapCenter.lng ** 2) -
        (Math.sqrt(b.location().lat ** 2 + b.location().lng ** 2) -
          Math.sqrt(mapCenter.lat ** 2 + mapCenter.lng ** 2))
      );
    });

    spots.sort((a, b) => b?.media?.length ?? 0 - a?.media?.length ?? 0);

    this.visibleSpots = spots;
  }

  speedDialMiniFabClick(index: number) {
    switch (index) {
      case 0:
        this.router.navigateByUrl("/kml-import");
        break;
      default:
        console.error("Uncaught fab click registered");
        break;
    }
  }

  // Initialization ///////////////////////////////////////////////////////////

  ngOnInit() {
    console.log("MapPageComponent ngOnInit");
    this._getSpotIdFromRoute()
      .then((spotId) => {
        if (spotId) {
          console.log("got spotId from route", spotId, "loading now");
          return this.loadSpotById(spotId);
        }
        return Promise.reject();
      })
      .then(() => {
        console.log("loaded spot");
      })
      .catch((err) => {
        if (!err) return; // ignore, because no spotId was found in route
        console.error("Error loading spot", err);
      });
  }

  async ngAfterViewInit() {
    // if (!this.spotMap) {
    //   // wait 200ms then try again
    //   setTimeout(() => {
    //     this.ngAfterViewInit();
    //   }, 2000);
    //   return;
    // }

    // subscribe to changes of the route
    this.router.events
      .pipe(
        filter((event) => {
          return event instanceof NavigationEnd;
        })
      )
      .subscribe(async (event: NavigationEnd) => {
        const spotId = await this._getSpotIdFromRoute();
        if (spotId) await this.loadSpotById(spotId); // TODO out of context
      });

    // subscribe to the spot search control and update the search results
    this.spotSearchControl.valueChanges.subscribe((query) => {
      if (query) {
        this._searchService
          .searchSpotsAndGeocodePlaces(query)
          .then((results) => {
            this.spotAndPlaceSearchResults$.next(results);
            console.log("results", results);
          });
      } else {
        this.spotAndPlaceSearchResults$.next(null);
      }

      //   this.mapsService
      //     .autocompletePlaceSearch(query, ["geocode"])
      //     .then((results) => {
      //       this.spotAndPlaceSearchResults$.next({
      //         places: results,
      //         spots: null,
      //       });
      //     });
    });
  }

  async _getSpotIdFromRoute(): Promise<SpotId | void> {
    let spotIdOrSlug: SpotId | SpotSlug = this.route.snapshot.paramMap.get(
      "spot"
    ) as SpotId | SpotSlug;

    if (["null", "undefined"].includes(spotIdOrSlug as string)) return;

    if (!spotIdOrSlug && this.route.snapshot.queryParamMap.keys.length > 0) {
      spotIdOrSlug = (this.route.snapshot.queryParamMap.get("id") ??
        this.route.snapshot.queryParamMap.get("spot") ??
        this.route.snapshot.queryParamMap.get("spotId") ??
        this.route.snapshot.queryParamMap.get("slug") ??
        "") as SpotId | SpotSlug;
    }

    if (spotIdOrSlug) {
      // first search for possible slugs
      let spotId: SpotId = "" as SpotId;
      try {
        spotId = await this._slugsService.getSpotIdFromSpotSlugHttp(
          spotIdOrSlug as SpotSlug
        );
      } catch (e) {
        // ignore error
      } finally {
        if (!spotId) spotId = spotIdOrSlug as SpotId;

        return spotId;
      }
    }
  }

  openSpotOrGooglePlace(value: { type: "place" | "spot"; id: string }) {
    if (value.type === "place") {
      this.openGooglePlaceById(value.id);
    } else {
      this.loadSpotById(value.id as SpotId).then(() => {
        if (!this.selectedSpot) return;
        this.spotMap?.focusSpot(this.selectedSpot);
      });
    }
  }

  openGooglePlaceById(id: string) {
    this.mapsService.getGooglePlaceById(id).then((place) => {
      if (!place?.geometry?.viewport) return;
      this.spotMap?.focusBounds(place.geometry.viewport);
    });
  }

  async loadSpotById(spotId: SpotId): Promise<void> {
    const spot: Spot = await this._spotsService.getSpotByIdHttp(
      spotId,
      this.locale
    );
    this.selectedSpot = spot;
    this.setSpotMetaTags();
    console.log("is selected spot now");
  }

  updateMapURL() {
    if (this.selectedSpot && this.selectedSpot instanceof Spot) {
      this.location.go(`/map/${this.selectedSpot.id}`);
    } else {
      this.location.go(`/map`);
    }
  }

  setSpotMetaTags() {
    const spot = this.selectedSpot;

    if (spot === null) {
      this.clearTitleAndMetaTags();
      return;
    }

    const title: string = `${spot.name} - PKFR Spot`;
    const image_src: string = spot.previewImageSrc();
    const description: string =
      $localize`:The text before the localized location of the spot. E.g. Spot in Wiedikon, Zurich, CH@@spot.locality.pretext:Spot in ` +
      spot.localityString();

    this.metaInfoService.setMetaTags(title, image_src, description);

    console.debug("Set meta tags for spot", spot.name());
  }

  clearTitleAndMetaTags() {
    this.titleService.setTitle($localize`:@@pkfr.spotmap.title:PKFR Spot map`);
  }
}
