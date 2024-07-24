import {
  Component,
  ViewChild,
  AfterViewInit,
  OnInit,
  Inject,
  PLATFORM_ID,
} from "@angular/core";
import { Spot } from "../../scripts/db/Spot";
import { ActivatedRoute, Router } from "@angular/router";
import { SpeedDialFabButtonConfig } from "../speed-dial-fab/speed-dial-fab.component";
import { AuthenticationService } from "../authentication.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MapsApiService } from "../maps-api.service";
import { BehaviorSubject, firstValueFrom, take, timeout } from "rxjs";
import { animate, style, transition, trigger } from "@angular/animations";
import { BottomSheetComponent } from "../bottom-sheet/bottom-sheet.component";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SearchService } from "../search.service";
import { SearchResponse } from "typesense/lib/Typesense/Documents";
import { SpotMapComponent } from "../spot-map/spot-map.component";
import {
  Location,
  NgIf,
  NgFor,
  AsyncPipe,
  isPlatformServer,
} from "@angular/common";
import { StorageService } from "../storage.service";
import { GlobalVariables } from "../../scripts/global";
import { SpotListComponent } from "../spot-list/spot-list.component";
import { DatabaseService } from "../database.service";
import { UserMenuContentComponent } from "../user-menu-content/user-menu-content.component";
import { SpotCompactViewComponent } from "../spot-compact-view/spot-compact-view.component";
import { MatOption } from "@angular/material/core";
import {
  MatAutocompleteTrigger,
  MatAutocomplete,
} from "@angular/material/autocomplete";
import { MatInput } from "@angular/material/input";
import { MatIcon } from "@angular/material/icon";
import { MatMenuTrigger, MatMenu } from "@angular/material/menu";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatFormField, MatSuffix } from "@angular/material/form-field";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-map-page",
  templateUrl: "./map-page.component.html",
  styleUrls: ["./map-page.component.scss"],
  animations: [
    trigger("inOutAnimation", [
      transition(":enter", [
        style({ height: 0, opacity: 0, scale: 0.8 }),
        animate("0.3s ease-out", style({ height: "*", opacity: 1, scale: 1 })),
      ]),
      transition(":leave", [
        style({ height: "*", opacity: 1, scale: 1 }),
        animate("0.3s ease-in", style({ height: 0, opacity: 0, scale: 0.8 })),
      ]),
    ]),
  ],
  standalone: true,
  imports: [
    SpotMapComponent,
    MatFormField,
    NgIf,
    MatIconButton,
    MatButtonModule,
    MatSuffix,
    MatMenuTrigger,
    MatIcon,
    MatInput,
    FormsModule,
    MatAutocompleteTrigger,
    ReactiveFormsModule,
    MatAutocomplete,
    NgFor,
    MatOption,
    SpotCompactViewComponent,
    SpotListComponent,
    BottomSheetComponent,
    MatMenu,
    UserMenuContentComponent,
    AsyncPipe,
  ],
})
export class MapPageComponent implements OnInit, AfterViewInit {
  @ViewChild("spotMap", { static: true }) spotMap: SpotMapComponent;
  @ViewChild("bottomSheet") bottomSheet: BottomSheetComponent;

  selectedSpot: Spot.Class = null;
  isEditing: boolean = false;
  mapStyle: string = "roadmap";

  askedGeoPermission: boolean = false;
  hasGeolocation: boolean = false;

  visibleSpots: Spot.Class[] = [];

  spotSearchControl = new FormControl();
  spotAndPlaceSearchResults$: BehaviorSubject<{
    places: google.maps.places.AutocompletePrediction[] | null;
    spots: SearchResponse<any> | null;
  }> = new BehaviorSubject(null);

  alainMode: boolean;

  isServer: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    public route: ActivatedRoute,
    public authService: AuthenticationService,
    public mapsService: MapsApiService,
    public storageService: StorageService,
    private _dbService: DatabaseService,
    private _searchService: SearchService,
    private router: Router,
    private location: Location,
    private _snackbar: MatSnackBar,
    private titleService: Title
  ) {
    GlobalVariables.alainMode.subscribe((value) => {
      this.alainMode = value;
    });

    this.isServer = isPlatformServer(platformId);

    this.titleService.setTitle(`PKFR Spot map`);
  }

  async ngOnInit() {
    let spotId: string =
      this.route.snapshot.paramMap.get("id") ??
      this.route.snapshot.paramMap.get("spotID") ??
      this.route.snapshot.queryParamMap.get("spot") ??
      this.route.snapshot.queryParamMap.get("spotId") ??
      "";

    if (spotId) {
      await this.openSpotById(spotId);
    }
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

  setVisibleSpots(spots: Spot.Class[], mapCenter: google.maps.LatLngLiteral) {
    if (!spots || !mapCenter) return;
    spots.sort((a, b) => {
      return (
        Math.sqrt(a.location.lat ** 2 + a.location.lng ** 2) -
        Math.sqrt(mapCenter.lat ** 2 + mapCenter.lng ** 2) -
        (Math.sqrt(b.location.lat ** 2 + b.location.lng ** 2) -
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

  ngAfterViewInit() {
    // subscribe to the spot search control and update the search results
    this.spotSearchControl.valueChanges.subscribe((query) => {
      //   if (query) {
      //     this._searchService
      //       .searchSpots(query)
      //       .then((results) => {
      //         this.spotAndPlaceSearchResults$.next(results);
      //         console.log("results", results);
      //       });
      //   } else {
      //     this.spotAndPlaceSearchResults$.next(null);
      //   }

      this.mapsService
        .autocompletePlaceSearch(query, ["geocode"])
        .then((results) => {
          this.spotAndPlaceSearchResults$.next({
            places: results,
            spots: null,
          });
        });
    });
  }

  openSpotOrGooglePlace(value: { type: "place" | "spot"; id: string }) {
    if (value.type === "place") {
      this.openGooglePlaceById(value.id);
    } else {
      this.openSpotById(value.id);
    }
  }

  openGooglePlaceById(id: string) {
    this.mapsService.getGooglePlaceById(id).then((place) => {
      this.spotMap.focusBounds(place.geometry.viewport);
    });
  }

  async openSpotById(spotId: string): Promise<void> {
    if (typeof this.spotMap === "undefined" || this.spotMap === null) {
      throw new Error(
        "Map page: openSpotById: Spot map is not defined at this time!"
      );
    }

    if (this.isServer) {
      await this.spotMap.openSpotByIdAsync(spotId);
    } else {
      this.spotMap.openSpotByIdWithSubscription(spotId);
    }
  }

  updateMapURL() {
    if (this.selectedSpot) {
      this.location.go(`/map/${this.selectedSpot.id}`);
    } else {
      this.location.go(`/map`);
    }
  }
}
