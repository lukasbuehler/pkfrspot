import {
  Component,
  OnInit,
  ViewChild,
  QueryList,
  ViewChildren,
  NgZone,
} from "@angular/core";
import { map_style } from "./map_style";

interface LoadedSpotReference {
  spot: Spot.Class;
  tile: { x: number; y: number };
  indexInTileArray: number;
  indexInTotalArray: number;
}

import { DatabaseService } from "../database.service";
import { Spot } from "src/scripts/db/Spot";
import { MapHelper } from "../../scripts/map_helper";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { SpotCompactViewComponent } from "../spot-compact-view/spot-compact-view.component";
import { SpeedDialFabButtonConfig } from "../speed-dial-fab/speed-dial-fab.component";
import { AuthenticationService } from "../authentication.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { GoogleMap, MapPolygon, MapAnchorPoint } from "@angular/google-maps";
import { GeoPoint } from "firebase/firestore";
import { MapsApiService } from "../maps-api.service";
import { take } from "rxjs";

@Component({
  selector: "app-map-page",
  templateUrl: "./map-page.component.html",
  styleUrls: ["./map-page.component.scss"],
})
export class MapPageComponent implements OnInit {
  @ViewChild("map") map: GoogleMap;
  @ViewChildren("polygon", { read: MapPolygon })
  polygons: QueryList<MapPolygon>;
  // SpotDetailComponent is only there if there is a spot selected, so static must be set to false.
  @ViewChild(SpotCompactViewComponent)
  spotDetail: SpotCompactViewComponent;

  speedDialButtonConfig: SpeedDialFabButtonConfig = {
    mainButton: {
      icon: "add_location",
      tooltip: "Create a new spot",
      color: "accent",
    },
    miniButtonColor: "secondary",
    miniButtons: [
      {
        icon: "note_add",
        tooltip: "Import Spots from a KML file",
      },
    ],
  };

  mainFabClicked() {
    this.createSpot();
  }

  miniFabPressed(index: number) {
    switch (index) {
      case 0:
        this.router.navigateByUrl("/kml-import");
        break;
      default:
        console.error("Uncaught fab click registered");
        break;
    }
  }

  //mapStyle: google.maps.MapTypeId = google.maps.MapTypeId.ROADMAP;
  mapStyle = "roadmap";
  mapStylesConfig = map_style;
  spotPolygons: MapPolygon[] = [];

  mapOptions: google.maps.MapOptions = {
    backgroundColor: "#000000",
    clickableIcons: false,
    gestureHandling: "greedy",
    mapTypeId: this.mapStyle,
    disableDefaultUI: true,
    styles: this.mapStylesConfig,
  };
  mapTypeId: string = "roadmap";
  selectedSpotMarkerOptions: google.maps.MarkerOptions = {
    draggable: false, // TODO needs to be true if isEditing is true
    clickable: false,
    icon: {
      url: "/assets/icons/marker.png",
    },
  };
  spotDotMarkerOptions: google.maps.MarkerOptions = {
    draggable: false, // TODO needs to be true if isEditing is true
    clickable: false,
    icon: {
      url: "/assets/icons/favicon-16x16.png",
    },
    opacity: 0.5,
  };
  spotCircleOptions: google.maps.CircleOptions = {
    fillColor: "#b8c4ff",
    fillOpacity: 0.75,
    draggable: false,
    clickable: true,
    strokeWeight: 0,
  };
  spotPolygonOptions: google.maps.PolygonOptions = {
    fillColor: "#b8c4ff",
    strokeColor: "#b8c4ff",
    fillOpacity: 0.1,
    editable: false,
    draggable: false,
    clickable: true,
  };

  isEditing: boolean = false;
  selectedSpot: Spot.Class = null;

  droppedMarkerLocation = null;

  spotDotZoomRadii: number[] = Array<number>(16);

  // The default coordinates are Paris, the origin of parkour.
  // modiying this resets the map
  readonly start_coordinates: google.maps.LatLngLiteral = {
    lat: 48.8517386,
    lng: 2.298386,
  };

  // these are updated from user input
  //   center_coordinates: google.maps.LatLngLiteral = {
  //     lat: this.start_coordinates.lat,
  //     lng: this.start_coordinates.lng,
  //   };

  start_zoom: number = 3;
  private readonly _loadAllSpotsZoomLevel: number = 16; // This is fixed for the platform and should not be changed
  // TODO ensure this is is constant with storing it somewhere else

  visibleSpots: Spot.Class[] = [];
  searchSpots: Spot.Class[] = [];
  loadedSpots: any = {}; // is a map of tile coords to spot arrays
  visibleDots: any[] = [];

  getAllSpots(): Spot.Class[] {
    const values = [];
    for (const key of Object.keys(this.loadedSpots)) {
      if (!key.includes("z16")) continue;
      values.push(this.loadedSpots[key]);
    }

    return [].concat.apply([], values);
  }

  zoomDotOpacities: number[] = [];
  zoomDotOpacity: number = 0;

  private _northEastTileCoordsZ16: google.maps.Point;
  private _southWestTileCoordsZ16: google.maps.Point;

  constructor(
    public authService: AuthenticationService,
    public mapsService: MapsApiService,
    private _dbService: DatabaseService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private _zone: NgZone,
    private _snackbar: MatSnackBar
  ) {
    // wait for google maps to initialize
    // this.mapsService.isApiLoaded$.pipe(take(1)).subscribe((success) => {
    //   if (success) {
    //     this.spotDotMarkerOptions.anchorPoint = new google.maps.Point(0.5, 0.5);
    //   }
    // });
  }

  ngOnInit() {
    let spotId: string = this.route.snapshot.paramMap.get("spotID") || "";
    let lat = this.route.snapshot.queryParamMap.get("lat") || null;
    let lng = this.route.snapshot.queryParamMap.get("lng") || null;
    let zoom = this.route.snapshot.queryParamMap.get("z") || 3; // TODO ?? syntax

    this.calculateAllDotRadii();
    this.calculateAllDotOpcacities();

    if (spotId) {
      this._dbService
        .getSpotById(spotId)
        .pipe(take(1))
        .subscribe(
          (spot) => {
            this.openSpot(spot);
            this.setStartMap(
              {
                lat: spot.location.lat,
                lng: spot.location.lng,
              },
              18
            );
          },
          (error) => {
            // the spot wasn't found, just go to the location if there is one
            console.error(error);
            this.setStartMap(
              { lat: Number(lat), lng: Number(lng) },
              Number(zoom)
            );
            this._snackbar.open(error.msg, "Dismiss", {
              duration: 5000,
              horizontalPosition: "center",
              verticalPosition: "bottom",
            });
          }
        );
      //console.log("Loading spot " + spotId);
      // Show loading spot to open
    } else {
      this.setStartMap({ lat: Number(lat), lng: Number(lng) }, Number(zoom));
    }

    // TODO remove
    this._dbService.getTestSpots().subscribe((spots) => {
      // add all these loaded spots to the loaded spots array
      for (let spot of spots) {
        let tile = spot.data.tile_coordinates.z16;
        if (!this.loadedSpots[`z${16}_${tile.x}_${tile.y}`]) {
          // the tile was not loaded before
          this.loadedSpots[`z${16}_${tile.x}_${tile.y}`] = [];
        }
        this.loadedSpots[`z${16}_${tile.x}_${tile.y}`].push(spot);
      }

      // TOOD change depending on zoom
      //this.updateVisibleDots();
      //this.updateVisibleSpots();
    });
  }

  setStartMap(coords: google.maps.LatLngLiteral, zoom: number) {
    if (coords && coords.lat && coords.lng) {
      this.start_coordinates.lat = coords.lat;
      this.start_coordinates.lng = coords.lng;
      this.start_zoom = Number(zoom || 16);

      this.map.panTo(this.start_coordinates);
    }
    this.start_zoom = zoom || this.start_zoom || 16;
  }

  clickedMap(event: google.maps.MapMouseEvent) {
    //console.log(event.latLng.toJSON());
    //console.log(MapHelper.getTileCoordinates(event.latLng.toJSON(), this.zoom));
  }

  boundsChanged() {
    //console.log("bounds changed");
    let zoomLevel = this.map.getZoom();
    let bounds = this.map.getBounds();

    let northEastLiteral: google.maps.LatLngLiteral = {
      lat: bounds.getNorthEast().lat(),
      lng: bounds.getNorthEast().lng(),
    };
    let southWestLiteral: google.maps.LatLngLiteral = {
      lat: bounds.getSouthWest().lat(),
      lng: bounds.getSouthWest().lng(),
    };

    let northEastTileCoords = MapHelper.getTileCoordinates(
      northEastLiteral,
      this._loadAllSpotsZoomLevel
    );
    let southWestTileCoords = MapHelper.getTileCoordinates(
      southWestLiteral,
      this._loadAllSpotsZoomLevel
    );

    this._northEastTileCoordsZ16 = northEastTileCoords;
    this._southWestTileCoordsZ16 = southWestTileCoords;

    if (zoomLevel >= this._loadAllSpotsZoomLevel) {
      this.visibleDots = [];
      // inside this zoom level we are constantly loading spots if new tiles become visible

      //this.loadNewSpotOnTiles(northEastTileCoords, southWestTileCoords);
      this.updateVisibleSpots();
    } else {
      // hide the spots and show the dots
      this.visibleSpots = [];
      this.updateVisibleDots();
      //   if (zoomLevel <= 2) {
      //     zoomLevel = 2;
      //     this._northEastTileCoordsZ16.x = 0;
      //     this._northEastTileCoordsZ16.y = 0;
      //     this._southWestTileCoordsZ16.x = (1 << 16) - 1;
      //     this._southWestTileCoordsZ16.y = (1 << 16) - 1;
      //   }
      //   if (zoomLevel <= this._loadAllSpotsZoomLevel - 2) {
      //     if (zoomLevel % 2 !== 0) {
      //       zoomLevel--;
      //     }
      //     const tileCoords: { ne: google.maps.Point; sw: google.maps.Point } = {
      //       ne: new google.maps.Point(
      //         this._northEastTileCoordsZ16.x >> (16 - zoomLevel),
      //         this._northEastTileCoordsZ16.y >> (16 - zoomLevel)
      //       ),
      //       sw: new google.maps.Point(
      //         this._southWestTileCoordsZ16.x >> (16 - zoomLevel),
      //         this._southWestTileCoordsZ16.y >> (16 - zoomLevel)
      //       ),
      //     };

      // this.loadNewSpotDotsOnTiles(zoomLevel, tileCoords.ne, tileCoords.sw);
      //}
    }
  }

  centerChanged() {
    let center: google.maps.LatLngLiteral = this.map.getCenter().toJSON();
    this.upadateMapURL(center, this.map.getZoom());
  }

  calculateAllDotRadii() {
    for (let i = 0; i < 16; i++) {
      this.spotDotZoomRadii[i] = this.calculateDotRadius(i);
    }
  }

  calculateDotRadius(zoom: number) {
    let radius = 10 * (1 << (16 - zoom));
    return radius;
  }

  calculateAllDotOpcacities() {
    for (let zoom = 0; zoom < 16; zoom++) {
      const opacity = Math.min(Math.max((zoom - 4) / 20, 0.05), 0.8);
      this.zoomDotOpacities.push(opacity);
    }
  }

  oldDotRadius(zoom, location) {
    let mercator = Math.cos((location.latitude * Math.PI) / 180);
    let radius = 5 * (1 << (16 - zoom)) * (1 / mercator);
    return radius;
  }

  zoomChanged() {
    let newZoom = this.map.getZoom();
    this.upadateMapURL(this.map.getCenter().toJSON(), newZoom);
  }

  upadateMapURL(center: google.maps.LatLngLiteral, zoom: number) {
    if (this.selectedSpot) {
      this.location.go(
        `/map/${this.selectedSpot.id}?lat=${center.lat}&lng=${center.lng}&z=${zoom}`
      );
    } else {
      this.location.go(`/map?lat=${center.lat}&lng=${center.lng}&z=${zoom}`);
    }
  }

  /**
   * This function takes in the new corners of the visible area and hides and shows spots as necessairy
   * @param northEastLiteral
   * @param southWestLiteral
   */
  updateVisibleSpots() {
    // clear visible spots
    this.visibleSpots = [];

    for (
      let x = this._southWestTileCoordsZ16.x;
      x <= this._northEastTileCoordsZ16.x;
      x++
    ) {
      for (
        let y = this._northEastTileCoordsZ16.y;
        y <= this._southWestTileCoordsZ16.y;
        y++
      ) {
        // here we go through all the x,y pairs for every visible tile on screen right now.

        if (this.loadedSpots[`z${16}_${x}_${y}`]) {
          this.visibleSpots = this.visibleSpots.concat(
            this.loadedSpots[`z${16}_${x}_${y}`]
          );
        }
      }
    }

    // If the selected spot is visible reference the instance from the visible spots
    if (this.selectedSpot) {
      const selectedSpotIndexInVisibleSpots: number =
        this.visibleSpots.findIndex((spot) => {
          return this.selectedSpot.id === spot.id;
        });
      if (selectedSpotIndexInVisibleSpots >= 0) {
        // The selected spot is visible, reference the instance from the visible
        // spots instead of the one from the database
        this.selectedSpot = this.visibleSpots[selectedSpotIndexInVisibleSpots];
      }
    }

    console.log(this.visibleSpots);
  }

  loadNewSpotOnTiles(
    northEastTileCoords: google.maps.Point,
    southWestTileCoords: google.maps.Point
  ) {
    let tilesToLoad: { x: number; y: number }[] = [];

    // make a list of coordinate pairs that we need to fetch from this.
    for (let x = southWestTileCoords.x; x <= northEastTileCoords.x; x++) {
      for (let y = northEastTileCoords.y; y <= southWestTileCoords.y; y++) {
        // here we go through all the x,y pairs for every visible tile on screen right now.
        if (!this.loadedSpots[`z${16}_${x}_${y}`]) {
          // the tile was not loaded before

          // mark this tile as loaded, will be filled after the data was
          // fetched. This prevents multiple fetches for the same tile
          // !([]) is false, !(undefined) is true
          // this way it wont be loaded twice
          this.loadedSpots[`z${16}_${x}_${y}`] = [];
          tilesToLoad.push({ x: x, y: y });
        }
      }
    }
    this.loadSpotsForTiles(tilesToLoad);
  }

  loadNewSpotDotsOnTiles(
    zoom: number,
    northEastTileCoords: google.maps.Point,
    southWestTileCoords: google.maps.Point
  ) {
    let tilesToLoad: { x: number; y: number }[] = [];

    // make a list of coordinate pairs that we need to fetch from this.
    for (let x = southWestTileCoords.x; x <= northEastTileCoords.x; x++) {
      for (let y = northEastTileCoords.y; y <= southWestTileCoords.y; y++) {
        // here we go through all the x,y pairs for every visible tile on screen right now.
        if (!this.loadedSpots[`z${zoom}_${x}_${y}`]) {
          // the tile was not loaded before

          // mark this tile as loaded, will be filled after the data was
          // fetched. This prevents multiple fetches for the same tile
          // !([]) is false, !(undefined) is true
          // this way it wont be loaded twice
          this.loadedSpots[`z${zoom}_${x}_${y}`] = [];
          tilesToLoad.push({ x: x, y: y });
        }
      }
    }

    // this._dbService.getPreviewSpotsForTiles(zoom, tilesToLoad).subscribe(
    //   (spots) => {
    //     if (spots.length > 0) {
    //       let tile = spots[0].data.tile_coordinates.z16;
    //       this.loadedSpots[`z${zoom}_${tile.x}_${tile.y}`] = spots;
    //       //console.log("new sposts laoded:");
    //       //console.log(spots);
    //       this.updateVisibleDots();
    //     }
    //   },
    //   (error) => {
    //     console.error(error);
    //   }
    // );
  }

  updateVisibleDots() {
    const allSpots: Spot.Class[] = this.getAllSpots();

    // temporary: // TODO REMOVE
    this.searchSpots = allSpots;

    this.visibleDots = allSpots.map((spot) => {
      return spot.location;
    });
  }

  toggleMapStyle() {
    if (
      this.mapTypeId.toLowerCase() ===
      google.maps.MapTypeId.ROADMAP.toLowerCase()
    ) {
      // if it is equal to roadmap, toggle to satellite
      this.mapTypeId = google.maps.MapTypeId.SATELLITE;
    } else {
      // otherwise toggle back to roadmap
      this.mapTypeId = google.maps.MapTypeId.ROADMAP;
    }
  }

  openSpot(spot: Spot.Class) {
    // Maybe just opened spot
    if (this.loadedSpots) this.selectedSpot = spot;

    this.focusSpot(spot);
  }

  focusSpot(spot: Spot.Class) {
    this._zone.run(() => {
      // needs to run in NgZone for change detection
      // https://github.com/SebastianM/angular-google-maps/issues/627
      // TODO STILL NOT WORKING THOUGH
      // Bug: It only works when the selected spot changes. Meaning if a
      // different spot is/was selected it pans correctly to the new spot
      // but otherwise it just does nothing.

      this.setStartMap(spot.location, 18);
      //this.upadateMapURL(spot.location, 18);
    });
  }

  createSpot() {
    //console.log("Create Spot");
    let center_coordinates: google.maps.LatLngLiteral = this.map
      .getCenter()
      .toJSON();

    this.selectedSpot = new Spot.Class(
      "", // The id needs to be empty for the spot to be recognized as new
      {
        name: { de_CH: "New Spot" }, // TODO change to user lang
        location: new GeoPoint(center_coordinates.lat, center_coordinates.lng),
      }
    );

    this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(this.selectedSpot);

    // sets the map and the spot to edit mode
    this.isEditing = true;
  }

  saveSpot(spotToSave: Spot.Class) {
    if (!spotToSave) return;

    console.log("saving the spot");
    console.log("Spot data to save: ", spotToSave.data);
    // If the spot does not have an ID, it does not exist in the database yet.
    if (spotToSave.id) {
      // this is an old spot that is edited
      this._dbService
        .setSpot(spotToSave.id, spotToSave.data)
        .then(() => {
          // Successfully updated
          this.isEditing = false;
          // TODO Snackbar or something
          console.log("Successfully saved spot");
          this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(spotToSave);
          console.log(this.getAllSpots());
        })
        .catch((error) => {
          this.isEditing = false;
          console.error("Error on spot save", error);
        });
    } else {
      // this is a new spot
      this._dbService
        .createSpot(spotToSave.data)
        .then((id) => {
          // Successfully created
          this.isEditing = false;

          // TODO add to loaded spots or something? or will it be loaded automatically after that?

          this.selectedSpot = new Spot.Class(id, spotToSave.data);

          // TODO snackbar or something
          console.log("Successfully crated spot");
          this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(spotToSave);
        })
        .catch((error) => {
          this.isEditing = false;
          console.error("There was an error creating this spot!", error);
        });
    }
  }

  discardEdit() {
    // reset paths of editing polygon
    // TODO

    // delete local newly created spots
    this.removeNewSpotFromLoadedSpotsAndUpdate();
  }

  getPathsFromSpotPolygon() {
    if (this.spotDetail?.hasBounds()) {
      this.polygons.forEach((polygon) => {
        if (polygon?.getEditable()) {
          const val = polygon.getPaths();

          // Convert LatLng[][] to LatLngLiteral[][]
          let paths: Array<Array<google.maps.LatLngLiteral>> = [];
          paths[0] = val[0].map((v, i, arr) => {
            return { lat: v.lat(), lng: v.lng() };
          });

          // this sets the paths for the selected spot and also sets the bounds for the spot data structure.
          this.selectedSpot.paths = paths;

          if (this.spotDetail) {
            this.saveSpot(this.selectedSpot); // update polygons on spot
          }
          // If the sidepanel is not open while editing, it might not be able to save.
        }
      });
    }
  }

  loadSpotsForTiles(tilesToLoad: { x: number; y: number }[]) {
    console.log("loading spots for tiles..." + tilesToLoad.toString());
    // this._dbService.getSpotsForTiles(tilesToLoad).subscribe(
    //   (spots) => {
    //     if (spots.length > 0) {
    //       let tile = spots[0].data.tile_coordinates.z16;
    //       this.loadedSpots[`z${16}_${tile.x}_${tile.y}`] = spots;
    //       this.updateVisibleSpots();
    //     }
    //   },
    //   (error) => {
    //     console.error(error);
    //   },
    //   () => {} // complete
    //);
  }

  spotMarkerMoved(event: { coords: google.maps.LatLngLiteral }) {
    if (this.selectedSpot) {
      this.selectedSpot.setLocation(event.coords);
      this.selectedSpot.location = event.coords; // reflect move on map
    } else {
      console.error(
        "User somehow could change the spot marker position without having a spot selected"
      );
    }
  }
  closeSpot() {
    this.selectedSpot = null;
    //this.upadateMapURL(this.center_coordinates, this.start_zoom);
  }

  /**
   * Add the first bounds to a spot. This can be used if the spot has no bounds attached to it.
   */
  addBounds() {
    const dist = 0.0001; //
    const location: google.maps.LatLngLiteral = this.selectedSpot.location;
    let _paths: Array<Array<google.maps.LatLngLiteral>> = [
      [
        { lat: location.lat + dist, lng: location.lng + dist },
        { lat: location.lat - dist, lng: location.lng + dist },
        { lat: location.lat - dist, lng: location.lng - dist },
        { lat: location.lat + dist, lng: location.lng - dist },
      ],
    ];
    //console.log("made inital bounds");
    this.selectedSpot.paths = _paths;

    this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(this.selectedSpot);
  }

  getReferenceToLoadedSpotById(spotId: string): LoadedSpotReference {
    const allSpots = this.getAllSpots();

    // find the spot with no id
    const spot: Spot.Class = allSpots.find((spot) => {
      return spot.id === spotId;
    });

    const tile = spot?.data?.tile_coordinates?.z16;
    const indexInTileArray =
      this.loadedSpots[`z${16}_${tile.x}_${tile.y}`].indexOf(spot);

    console.log(JSON.stringify(this.loadedSpots));

    const loadedSpotRef: LoadedSpotReference = {
      spot: spot,
      tile: tile,
      indexInTileArray: indexInTileArray,
      indexInTotalArray: spot ? allSpots.indexOf(spot) : -1,
    };

    return loadedSpotRef;
  }

  /**
   * Add a newly created spot (before first save) to the loaded spots for nice display. It can be identified by having its ID set to empty string
   * @param newSpot The newly created spot class.
   */
  addOrUpdateNewSpotToLoadedSpotsAndUpdate(newSpot: Spot.Class) {
    // Get the tile coordinates to save in loaded spots
    const ref = this.getReferenceToLoadedSpotById(newSpot.id);

    console.log(ref);
    if (ref.spot && ref.indexInTileArray >= 0 && ref.tile) {
      // The spot exists and should be updated

      // Update the spot
      this.loadedSpots[`z${16}_${ref.tile.x}_${ref.tile.y}`][
        ref.indexInTileArray
      ] = newSpot;
    } else {
      // the spot does not exist
      let spots = this.loadedSpots[`z${16}_${ref.tile.x}_${ref.tile.y}`];
      if (spots) {
        spots.push(newSpot);
      } else {
        console.error("There are no spots loaded for this tile");
      }
    }

    // update the map to show the new spot on the loaded spots array.
    this.updateVisibleSpots();
  }

  /**
   * This function is used if the new spot was deleted, discarded or never saved.
   * It removes the first spot it finds without an id.
   */
  removeNewSpotFromLoadedSpotsAndUpdate() {
    const spotToRemoveRef = this.getReferenceToLoadedSpotById("");

    if (
      spotToRemoveRef.spot &&
      spotToRemoveRef.tile &&
      spotToRemoveRef.indexInTileArray >= 0
    ) {
      this.loadedSpots[
        `z${16}_${spotToRemoveRef.tile.x}_${spotToRemoveRef.tile.y}`
      ].splice(spotToRemoveRef.indexInTileArray, 1);
    } else {
      console.warn("Dev: No spot to remove from loaded spots was found");
    }
  }

  /**
   * This function is used if the new spot was saved and now has an id. It replaces the first spot it finds with no ID with the newSaveSpot
   * @param newSavedSpot The new spot that replaces the unsaved new spot
   */
  updateNewSpotIdOnLoadedSpotsAndUpdate(newSavedSpot: Spot.Class) {
    if (newSavedSpot.id) {
      // TODO
    } else {
      console.error(
        "The newly saved spot doesn't have an ID attached to it. Something is wrong"
      );
    }
  }
}
