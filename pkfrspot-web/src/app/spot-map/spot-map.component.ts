import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { Spot } from "../../scripts/db/Spot";
import { DatabaseService } from "../database.service";
import { ActivatedRoute } from "@angular/router";
import { GeoPoint } from "firebase/firestore";
import { take } from "rxjs";
import { MapHelpers } from "../../scripts/MapHelpers";
import { AuthenticationService } from "../authentication.service";
import { MapComponent } from "../map/map.component";
import { SpotClusterTile } from "../../scripts/db/SpotClusterTile";
import { Meta, Title } from "@angular/platform-browser";
import { MapsApiService } from "../maps-api.service";

/**
 * This interface is used to reference a spot in the loaded spots array.
 */
interface LoadedSpotReference {
  spot: Spot.Class;
  tile: { x: number; y: number };
  indexInTileArray: number;
  indexInTotalArray: number;
}

type Dot = google.maps.visualization.WeightedLocation;

@Component({
  selector: "app-spot-map",
  templateUrl: "./spot-map.component.html",
  styleUrls: ["./spot-map.component.scss"],
  standalone: true,
  imports: [MapComponent],
})
export class SpotMapComponent implements AfterViewInit {
  @ViewChild("map") map: MapComponent;

  @Input() selectedSpot: Spot.Class | null = null;
  @Output() selectedSpotChange = new EventEmitter<Spot.Class | null>();

  setSelectedSpot(value: Spot.Class | null) {
    if (value !== this.selectedSpot) {
      this.selectedSpot = value;
      this.selectedSpotChange.emit(value);
    }
  }

  @Input() isEditing: boolean = false;
  @Output() isEditingChange = new EventEmitter<boolean>();

  setIsEditing(value: boolean) {
    if (value !== this.isEditing) {
      this.isEditing = value;
      this.isEditingChange.emit(value);
    }
  }

  @Input() mapStyle: string = "roadmap";
  @Output() mapStyleChange = new EventEmitter<string>();

  @Output() hasGeolocationChange = new EventEmitter<boolean>();

  visibleSpots: Spot.Class[] = [];
  loadedSpots: Map<string, Spot.Class[]> = new Map<string, Spot.Class[]>(); // is a map of tile coords to spot arrays
  @Output() visibleSpotsChange = new EventEmitter<Spot.Class[]>();

  @Input() markers: google.maps.LatLngLiteral[] = [];
  @Input() selectedMarker: google.maps.LatLngLiteral | null = null;

  @Input() isClickable: boolean = true;

  uneditedSpot: Spot.Class = null;

  startZoom: number = 4;
  mapZoom: number = this.startZoom;
  mapCenterStart: google.maps.LatLngLiteral = {
    lat: 48.6270939,
    lng: 2.4305363,
  };
  mapCenter: google.maps.LatLngLiteral;
  bounds: google.maps.LatLngBounds;

  visibleDots: Dot[] = [];
  loadedDots = {
    2: new Map<string, Dot[]>(),
    4: new Map<string, Dot[]>(),
    6: new Map<string, Dot[]>(),
    8: new Map<string, Dot[]>(),
    10: new Map<string, Dot[]>(),
    12: new Map<string, Dot[]>(),
    14: new Map<string, Dot[]>(),
  };

  private _northEastTileCoordsZ16: google.maps.Point;
  private _southWestTileCoordsZ16: google.maps.Point;

  constructor(
    public titleService: Title,
    private route: ActivatedRoute,
    private _dbService: DatabaseService,
    private authService: AuthenticationService,
    private meta: Meta,
    private mapsAPIService: MapsApiService
  ) {}

  isInitiated: boolean = false;

  ngAfterViewInit(): void {
    let spotId: string = this.route.snapshot.paramMap.get("spotID") ?? "";

    if (!spotId) {
      // load the last location and zoom from memory
      this.mapsAPIService
        .loadLastLocationAndZoom()
        .then((lastLocationAndZoom) => {
          if (lastLocationAndZoom) {
            this.map.center = lastLocationAndZoom.location;
            this.mapZoom = lastLocationAndZoom.zoom;
          } else {
            this.map.center = this.mapCenterStart;
            this.mapZoom = this.startZoom;
          }
          this.isInitiated = true;
        });
    }
  }

  // Map events ///////////////////////////////////////////////////////////////

  zoomChanged(zoom: number) {
    this.mapZoom = zoom;

    this.updateVisibleDots();
  }

  mapClick(event: google.maps.MapMouseEvent) {
    /**
     * When the map is clicked with a spot open, the spot is
     * closed and the bottom panel cloes as well.
     */
    if (this.selectedSpot) {
      this.closeSpot();
    }
  }

  focusOnGeolocation() {
    this.map.useGeolocation();
    this.map.focusOnGeolocation();
  }

  mapBoundsChanged(bounds: google.maps.LatLngBounds, zoom: number) {
    this.bounds = bounds;

    // store the new last location
    let newCenter: google.maps.LatLngLiteral = bounds.getCenter().toJSON();
    if (this.isInitiated && newCenter !== this.mapCenterStart) {
      if (this.mapCenter !== newCenter || zoom !== this.mapZoom) {
        this.mapsAPIService.storeLastLocationAndZoom({
          location: newCenter,
          zoom: zoom,
        });
      }
    }

    let northEastLiteral: google.maps.LatLngLiteral = {
      lat: bounds.getNorthEast().lat(),
      lng: bounds.getNorthEast().lng(),
    };
    let southWestLiteral: google.maps.LatLngLiteral = {
      lat: bounds.getSouthWest().lat(),
      lng: bounds.getSouthWest().lng(),
    };

    let northEastTileCoords: google.maps.Point =
      MapHelpers.getTileCoordinatesForLocationAndZoom(northEastLiteral, 16);
    let southWestTileCoords: google.maps.Point =
      MapHelpers.getTileCoordinatesForLocationAndZoom(southWestLiteral, 16);

    this._northEastTileCoordsZ16 = northEastTileCoords;
    this._southWestTileCoordsZ16 = southWestTileCoords;

    if (zoom >= 16) {
      //   this.visibleDots = [];
      // inside this zoom level we are constantly loading spots if new tiles become visible

      const tilesToLoad = this.getNewTilesToLoad(
        16,
        northEastTileCoords,
        southWestTileCoords,
        this.loadedSpots
      );
      this.loadSpotsForTiles(tilesToLoad);
      this.updateVisibleSpots();
    } else {
      // hide the spots and show the dots
      this.clearVisibleSpots();

      let zoomLevel = zoom;

      if (zoomLevel <= 2) {
        zoomLevel = 2;
        this._northEastTileCoordsZ16.x = 0;
        this._northEastTileCoordsZ16.y = 0;
        this._southWestTileCoordsZ16.x = (1 << 16) - 1;
        this._southWestTileCoordsZ16.y = (1 << 16) - 1;
      } else if (zoomLevel % 2 !== 0) {
        zoomLevel--;
      }

      const tileCoords: { ne: google.maps.Point; sw: google.maps.Point } = {
        ne: new google.maps.Point(
          this._northEastTileCoordsZ16.x >> (16 - zoomLevel + 2),
          this._northEastTileCoordsZ16.y >> (16 - zoomLevel + 2)
        ),
        sw: new google.maps.Point(
          this._southWestTileCoordsZ16.x >> (16 - zoomLevel + 2),
          this._southWestTileCoordsZ16.y >> (16 - zoomLevel + 2)
        ),
      };

      const tilesToLoad = this.getNewTilesToLoad(
        zoomLevel,
        tileCoords.ne,
        tileCoords.sw,
        this.loadedDots[zoomLevel]
      );

      this.loadNewDotsOnTiles(zoomLevel, tilesToLoad);
    }
  }

  // Spot loading /////////////////////////////////////////////////////////////

  getAllSpots(): Spot.Class[] {
    const values = [];
    for (const key of this.loadedSpots.keys()) {
      if (!key.includes("z16")) continue;
      values.push(this.loadedSpots.get(key));
    }

    return [].concat.apply([], values);
  }

  getNewTilesToLoad(
    zoom: number,
    northEastTileCoords: google.maps.Point,
    southWestTileCoords: google.maps.Point,
    loadedSpots: Map<string, any>
  ) {
    let tilesToLoad: { x: number; y: number }[] = [];

    // make a list of coordinate pairs that we need to fetch from this.
    for (let x = southWestTileCoords.x; x <= northEastTileCoords.x; x++) {
      for (let y = northEastTileCoords.y; y <= southWestTileCoords.y; y++) {
        // here we go through all the x,y pairs for every visible tile on screen right now.
        if (!loadedSpots.has(`z${zoom}_${x}_${y}`)) {
          // the tile was not loaded before

          // mark this tile as loaded, it will be filled after the data was
          // fetched. This prevents multiple fetches for the same tile
          // !([]) is false, !(undefined) is true
          // this way it wont be loaded twice
          //loadedSpots.set(`z${zoom}_${x}_${y}`, []);
          tilesToLoad.push({ x: x, y: y });
        }
      }
    }

    return tilesToLoad;
  }

  // Public Map helper functions

  clearVisibleSpots() {
    this.visibleSpots = [];
    this.visibleSpotsChange.emit([]);
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
        if (this.loadedSpots.has(`z${16}_${x}_${y}`)) {
          const spotsOnThisTile = this.loadedSpots.get(`z${16}_${x}_${y}`);
          this.visibleSpots = this.visibleSpots.concat(spotsOnThisTile);
        }
      }
    }
    this.visibleSpotsChange.emit(this.visibleSpots);

    // If the selected spot is visible reference the instance from the visible spots
    if (this.selectedSpot) {
      const selectedSpotIndexInVisibleSpots: number =
        this.visibleSpots.findIndex((spot) => {
          return this.selectedSpot.id === spot.id;
        });
      if (selectedSpotIndexInVisibleSpots >= 0) {
        // The selected spot is visible, reference the instance from the visible
        // spots instead of the one from the database
        this.setSelectedSpot(
          this.visibleSpots[selectedSpotIndexInVisibleSpots]
        );
      }
    }
  }

  updateVisibleDots() {
    let zoom = 2;
    if (this.mapZoom > 2) {
      zoom = this.mapZoom % 2 === 0 ? this.mapZoom : this.mapZoom - 1;
    }

    if (this.loadedDots[zoom]?.size > 0) {
      const dotArrays: Dot[] = Array.from(this.loadedDots[zoom].values());
      this.visibleDots = [].concat(...dotArrays);
    }
  }

  openSpotById(spotId: string) {
    this._dbService
      .getSpotById(spotId)
      .pipe(take(1))
      .subscribe((spot) => {
        this.openSpot(spot);
      });
  }

  openSpot(spot: Spot.Class) {
    this.setSpotMetaTags(spot);

    this.setSelectedSpot(spot);
    this.focusSpot(spot);
  }

  setSpotMetaTags(spot: Spot.Class) {
    this.titleService.setTitle(`PKFR Spot map: ${spot.name}`);
    this.meta.updateTag(
      { name: "og:title", content: spot.name },
      'name="og:title"'
    );
    this.meta.updateTag(
      { name: "og:description", content: spot.description },
      'name="og:title"'
    );

    this.meta.addTags(
      [
        { name: "twitter:title", content: spot.name },
        { name: "twitter::description", content: spot.description },
      ],
      true
    );
  }

  focusSpot(spot: Spot.Class) {
    this.focusPoint(spot.location);
  }

  focusPoint(point: google.maps.LatLngLiteral, zoom: number = 17) {
    this.map.googleMap.panTo(point);
    if (this.mapZoom < zoom) {
      this.mapZoom = zoom;
    }
  }

  focusBounds(bounds: google.maps.LatLngBounds) {
    this.map.fitBounds(bounds);
  }

  toggleMapStyle() {
    this.map.toggleMapStyle();
  }

  createSpot() {
    if (!this.authService.isSignedIn) {
      // TODO show sign in dialog
      alert("Please sign in to create a spot"); // TODO
      return;
    }

    let center_coordinates: google.maps.LatLngLiteral = this.map.center;

    this.setSelectedSpot(
      new Spot.Class(
        "", // The id needs to be empty for the spot to be recognized as new
        {
          name: { de_CH: "New Spot" }, // TODO change to user lang
          location: new GeoPoint(
            center_coordinates.lat,
            center_coordinates.lng
          ),
        }
      )
    );

    // sets the map and the spot to edit mode
    this.setIsEditing(true);
  }

  saveSpot(spot: Spot.Class) {
    if (!spot) return;

    if (spot.hasBounds()) {
      let editedPaths = this.map.getPolygonPathForSpot(spot.id);
      if (editedPaths) {
        spot.paths = editedPaths;
      }
    }

    // If the spot does not have an ID, it does not exist in the database yet.

    let saveSpotPromise: Promise<void>;
    if (spot.id) {
      // this is an old spot that is edited
      saveSpotPromise = this._dbService.setSpot(spot.id, spot.data);
    } else {
      // this is a new spot
      saveSpotPromise = this._dbService.createSpot(spot.data);
    }

    saveSpotPromise
      .then(() => {
        // Successfully updated
        this.setIsEditing(false);
        // TODO Snackbar or something
        this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(spot);
      })
      .catch((error) => {
        this.setIsEditing(false);
        console.error("Error on spot save", error);
      });
  }

  startEdit() {
    this.setIsEditing(true);

    this.uneditedSpot = this.selectedSpot.clone();
  }

  discardEdit() {
    // reset paths of editing polygon
    this.setIsEditing(false);

    if (!this.uneditedSpot) {
      // there is no backup unedited spot of the selected spot, therefore this is a newly created spot
      // delete local newly created spots
      //this.removeNewSpotFromLoadedSpotsAndUpdate();
      this.setSelectedSpot(null);
    } else {
      // set the selected spot to be the backup unedited spot
      this.setSelectedSpot(this.uneditedSpot);
      this.selectedSpot.paths = this.uneditedSpot.paths; // ?

      delete this.uneditedSpot;

      // reset the map to show the unedited spot
      // this.updateSpotInLoadedSpots(this.selectedSpot);
      // this.updateVisibleSpots();
    }
  }

  loadSpotsForTiles(tilesToLoad: { x: number; y: number }[]) {
    if (tilesToLoad.length === 0) return;

    // add the tiles to load to the map
    tilesToLoad.forEach((tile) => {
      const key = `z${16}_${tile.x}_${tile.y}`;
      if (!this.loadedSpots.has(key)) {
        this.loadedSpots.set(key, []);
      }
    });

    this._dbService.getSpotsForTiles(tilesToLoad).subscribe({
      next: (spots) => {
        if (spots.length > 0) {
          spots.forEach((spot) => {
            const tile = spot.data.tile_coordinates.z16;
            const key = `z${16}_${tile.x}_${tile.y}`;
            this.loadedSpots.get(key).push(spot);
          });
          this.updateVisibleSpots();
        }
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  loadNewDotsOnTiles(zoom: number, tilesToLoad: { x: number; y: number }[]) {
    if (zoom % 2 === 1) return;

    // tilesToLoad.forEach((tile) => {
    //     const key = `z${zoom}_${tile.x}_${tile.y}`;
    //     if (!this.loadedDots[zoom].has(key)) {
    //         this.loadedDots[zoom].set(key, []);
    //     }
    // });

    this._dbService.getSpotClusterTiles(zoom, tilesToLoad).subscribe({
      next: (clusterTiles) => {
        if (clusterTiles.length > 0) {
          clusterTiles.forEach((tile) => {
            const key = `z${zoom}_${tile.x}_${tile.y}`;
            const dots: Dot[] = tile.points.map((point) => {
              return {
                location: new google.maps.LatLng(
                  point.location.latitude,
                  point.location.longitude
                ),
                weight: point.weight,
              };
            });

            this.loadedDots[zoom].set(key, dots);
          });
          this.updateVisibleDots();
        }
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  spotMarkerMoved(event: { coords: google.maps.LatLngLiteral }) {
    if (this.selectedSpot) {
      this.selectedSpot.location = event.coords;
      this.selectedSpot.location = event.coords; // reflect move on map
    } else {
      console.error(
        "User somehow could change the spot marker position without having a spot selected"
      );
    }
  }

  /**
   * Unselect the spot and close the bottom panel
   */
  closeSpot() {
    if (this.isEditing) {
      // TODO show dialog
      alert(
        "You are currently editing a spot. Please save or discard your changes before closing the spot."
      );
      //this.discardEdit();
    }

    // unselect
    this.setSelectedSpot(null);

    this.titleService.setTitle(`PKFR Spot map`);
  }

  /**
   * Add the first bounds to a spot. This can be used if the spot has no bounds attached to it.
   */
  addBounds() {
    if (!this.selectedSpot.id) {
      console.error(
        "The spot has no ID. It needs to be saved before bounds can be added to it."
      );
      return;
    }

    // TODO fix with mercator projection (this brakes at the poles)
    const dist = 0.0001;
    const location: google.maps.LatLngLiteral = this.selectedSpot.location;
    let _paths: Array<Array<google.maps.LatLngLiteral>> = [
      [
        { lat: location.lat + dist, lng: location.lng + dist },
        { lat: location.lat - dist, lng: location.lng + dist },
        { lat: location.lat - dist, lng: location.lng - dist },
        { lat: location.lat + dist, lng: location.lng - dist },
      ],
    ];
    this.selectedSpot.paths = _paths;
  }

  getReferenceToLoadedSpotById(spotId: string): LoadedSpotReference | null {
    const allSpots = this.getAllSpots();

    // find the spot with no id
    const spot: Spot.Class = allSpots.find((spot) => {
      return spot.id === spotId;
    });

    if (spot) {
      const tile = spot?.tileCoordinates?.z16;
      const indexInTileArray = this.loadedSpots
        .get(`z${16}_${tile.x}_${tile.y}`)
        .indexOf(spot);

      const loadedSpotRef: LoadedSpotReference = {
        spot: spot,
        tile: tile,
        indexInTileArray: indexInTileArray,
        indexInTotalArray: spot ? allSpots.indexOf(spot) : -1,
      };

      return loadedSpotRef;
    } else {
      return null;
    }
  }

  /**
   * Add a newly created spot (before first save) to the loaded spots for nice display. It can be identified by having its ID set to empty string
   * @param newSpot The newly created spot class.
   */
  addOrUpdateNewSpotToLoadedSpotsAndUpdate(newSpot: Spot.Class) {
    //Get the tile coordinates to save in loaded spots
    const ref = this.getReferenceToLoadedSpotById(newSpot.id);
    console.log("spot to update ref", ref);
    if (ref?.spot && ref.indexInTileArray >= 0 && ref.tile) {
      // The spot exists and should be updated
      // Update the spot
      this.loadedSpots.get(`z${16}_${ref.tile.x}_${ref.tile.y}`)[
        ref.indexInTileArray
      ] = newSpot;
    } else {
      // the spot does not exist

      // get the tile coordinates for the location of the new spot
      let tile = MapHelpers.getTileCoordinatesForLocationAndZoom(
        newSpot.location,
        16
      );
      let spots = this.loadedSpots.get(`z${16}_${tile.x}_${tile.y}`);

      if (spots) {
        spots.push(newSpot);
      } else {
        // There are no spots loaded for this tile, add it to the loaded spots
        this.loadedSpots.set(`z${16}_${tile.x}_${tile.y}`, [newSpot]);
      }
    }
    // update the map to show the new spot on the loaded spots array.
    this.updateVisibleSpots();
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

  // Other public functions ///////////////////////////////////////////////////

  // calculateAllDotRadii() {
  //   for (let i = 0; i < 16; i++) {
  //     this.spotDotZoomRadii[i] = this.calculateDotRadius(i);
  //   }
  // }

  // calculateDotRadius(zoom: number) {
  //   let radius = 10 * (1 << (16 - zoom));
  //   return radius;
  // }

  // calculateAllDotOpcacities() {
  //   for (let zoom = 0; zoom < 16; zoom++) {
  //     const opacity = Math.min(Math.max((zoom - 4) / 20, 0.05), 0.8);
  //     this.zoomDotOpacities.push(opacity);
  //   }
  // }

  // oldDotRadius(zoom, location) {
  //   let mercator = Math.cos((location.latitude * Math.PI) / 180);
  //   let radius = 5 * (1 << (16 - zoom)) * (1 / mercator);
  //   return radius;
  // }
}
