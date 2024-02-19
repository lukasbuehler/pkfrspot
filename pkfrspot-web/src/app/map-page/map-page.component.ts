import { Component, ViewChild, AfterViewInit } from "@angular/core";
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
  hasGeolocation: boolean = false;

  visibleSpots: Spot.Class[] = [];

  spotSearchControl = new FormControl();
  spotSearchResults$: BehaviorSubject<SearchResponse<any> | null> =
    new BehaviorSubject(null);

  constructor(
    public authService: AuthenticationService,
    public mapsService: MapsApiService,
    private _searchService: SearchService,
    private router: Router,
    private location: Location,
    private _snackbar: MatSnackBar
  ) {}

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
      if (query) {
        this._searchService.searchSpots(query).then((results) => {
          this.spotSearchResults$.next(results);
        });
      }
      {
        this.spotSearchResults$.next(null);
      }
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
