import {
  Component,
  ViewChild,
  AfterViewInit,
  HostListener,
  Input,
} from "@angular/core";
import { Spot } from "src/scripts/db/Spot";
import { Router } from "@angular/router";
import { SpeedDialFabButtonConfig } from "../speed-dial-fab/speed-dial-fab.component";
import { AuthenticationService } from "../authentication.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MapsApiService } from "../maps-api.service";
import { BehaviorSubject } from "rxjs";
import { animate, style, transition, trigger } from "@angular/animations";
import { BottomSheetComponent } from "../bottom-sheet/bottom-sheet.component";
import { FormControl } from "@angular/forms";
import { SearchService } from "../search.service";
import { SearchResponse } from "typesense/lib/Typesense/Documents";
import { SpotMapComponent } from "../spot-map/spot-map.component";
import { Location } from "@angular/common";
import { StorageService } from "../storage.service";
import { GlobalVariables } from "src/scripts/global";

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
})
export class MapPageComponent implements AfterViewInit {
  @ViewChild("spotMap") spotMap: SpotMapComponent;
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

  constructor(
    public authService: AuthenticationService,
    public mapsService: MapsApiService,
    public storageService: StorageService,
    private _searchService: SearchService,
    private router: Router,
    private location: Location,
    private _snackbar: MatSnackBar
  ) {
    GlobalVariables.alainMode.subscribe((value) => {
      this.alainMode = value;
    });
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

  openSpotOrPlace(value: { type: "place" | "spot"; id: string }) {
    if (value.type === "place") {
      this.openPlaceById(value.id);
    } else {
      this.openSpotById(value.id);
    }
  }

  openPlaceById(id: string) {
    this.mapsService.getGooglePlaceById(id).then((place) => {
      this.spotMap.focusBounds(place.geometry.viewport);
    });
  }

  openSpotById(id: string) {
    this.spotMap.openSpotById(id);
  }

  updateMapURL() {
    if (this.selectedSpot) {
      this.location.go(`/map/${this.selectedSpot.id}`);
    } else {
      this.location.go(`/map`);
    }
  }
}
