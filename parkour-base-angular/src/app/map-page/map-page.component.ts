import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  QueryList,
  ViewChildren,
} from "@angular/core";
import { map_style } from "./map_style";

import * as firebase from "firebase";

//import "googlemaps";

import { DatabaseService } from "../database.service";
import { AgmMap, AgmPolygon } from "@agm/core";
import { Spot } from "src/scripts/db/Spot";
import { MapHelper } from "../../scripts/map_helper";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { SpotDetailComponent } from "../spot-detail/spot-detail.component";

@Component({
  selector: "app-map-page",
  templateUrl: "./map-page.component.html",
  styleUrls: ["./map-page.component.scss"],
})
export class MapPageComponent implements OnInit {
  @ViewChild("map", { static: true }) map: AgmMap;
  @ViewChildren("polygon", { read: AgmPolygon })
  polygons: QueryList<AgmPolygon>;
  // SpotDetailComponent is only there if there is a spot selected, so static must be set to false.
  @ViewChild(SpotDetailComponent)
  spotDetail: SpotDetailComponent;

  //mapStyle: google.maps.MapTypeId = google.maps.MapTypeId.ROADMAP;
  mapStyle = "roadmap";
  mapStylesConfig = map_style;
  spotPolygons: AgmPolygon[] = [];

  editingBounds: boolean = false;
  selectedSpot: Spot.Class = null;

  droppedMarkerLocation = null;

  // The default coordinates are Paris, the origin of parkour.
  // modiying this resets the map
  readonly start_coordinates: google.maps.LatLngLiteral = {
    lat: 48.8517386,
    lng: 2.298386,
  };

  // these are updated from user input
  center_coordinates: google.maps.LatLngLiteral = {
    lat: this.start_coordinates.lat,
    lng: this.start_coordinates.lng,
  };

  zoom: number = 3;
  private readonly _loadAllSpotsZoomLevel: number = 16; // This is fixed for the platform and should not be changed
  // TODO ensure this is is constant with storing it somewhere else

  visibleSpots: Spot.Class[] = [];
  searchSpots: Spot.Class[] = [];
  loadedSpots: any = {}; // is a map of tile coords to spot arrays
  visibleDots: any[] = [];

  private _northEastTileCoordsZ16: google.maps.Point;
  private _southWestTileCoordsZ16: google.maps.Point;

  constructor(
    private _dbService: DatabaseService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit() {
    let spotId: string = this.route.snapshot.paramMap.get("spot") || "";
    let lat = this.route.snapshot.queryParamMap.get("lat") || null;
    let lng = this.route.snapshot.queryParamMap.get("lng") || null;
    let zoom = this.route.snapshot.queryParamMap.get("z") || 3; // TODO ?? syntax

    if (spotId) {
      this._dbService.getSpotById(spotId).subscribe(
        (spot) => {
          console.log("Done loading spot");
          this.openSpot(spot); // Opens the spot in the drawer
          this.setStartMap(
            {
              lat: spot.data.location.latitude,
              lng: spot.data.location.longitude,
            },
            Number(zoom) || 16
          );
        },
        (error) => {
          // the spot wasn't found, just go to the location if there is one
          this.setStartMap(
            { lat: Number(lat), lng: Number(lng) },
            Number(zoom)
          );
        }
      );
      console.log("Loading spot " + spotId);
      // Show loading spot to open
      // TODO snackbar
    } else {
      this.setStartMap({ lat: Number(lat), lng: Number(lng) }, Number(zoom));
    }
  }

  setStartMap(coords: google.maps.LatLngLiteral, zoom: number) {
    if (coords && coords.lat && coords.lng) {
      this.start_coordinates.lat = coords.lat;
      this.start_coordinates.lng = coords.lng;
      this.zoom = Number(zoom || 16);

      this.center_coordinates = {
        lat: this.start_coordinates.lat,
        lng: this.start_coordinates.lng,
      };
    }
    this.zoom = zoom || this.zoom || 16;
  }

  clickedMap(coords) {
    console.log(coords);
    this.droppedMarkerLocation = coords.coords;
    console.log(MapHelper.getTileCoordinates(coords.coords, this.zoom));
  }

  boundsChanged(bounds: google.maps.LatLngBounds) {
    let zoomLevel = this.zoom;

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

      this.loadNewSpotOnTiles(northEastTileCoords, southWestTileCoords);
      this.updateVisibleSpots();
    } else {
      // hide the spots and show the dots
      this.visibleSpots = [];
      if (zoomLevel <= 2) {
        zoomLevel = 2;
        this._northEastTileCoordsZ16.x = 0;
        this._northEastTileCoordsZ16.y = 0;
        this._southWestTileCoordsZ16.x = (1 << 16) - 1;
        this._southWestTileCoordsZ16.y = (1 << 16) - 1;
      }
      if (zoomLevel <= this._loadAllSpotsZoomLevel - 2 && zoomLevel % 2 === 0) {
        const tileCoords: { ne: google.maps.Point; sw: google.maps.Point } = {
          ne: new google.maps.Point(
            this._northEastTileCoordsZ16.x >> (16 - zoomLevel),
            this._northEastTileCoordsZ16.y >> (16 - zoomLevel)
          ),
          sw: new google.maps.Point(
            this._southWestTileCoordsZ16.x >> (16 - zoomLevel),
            this._southWestTileCoordsZ16.y >> (16 - zoomLevel)
          ),
        };

        this.loadNewSpotDotsOnTiles(zoomLevel, tileCoords.ne, tileCoords.sw);
      }

      this.updateVisibleDots();
    }
  }

  getDotRadius(zoom, location) {
    let mercator = Math.cos((location.latitude * Math.PI) / 180);
    let radius = 5 * (1 << (16 - zoom)) * (1 / mercator);
    return radius;
  }

  centerChanged(center: google.maps.LatLngLiteral) {
    this.center_coordinates.lat = center.lat;
    this.center_coordinates.lng = center.lng;
    this.upadateMapURL(center, this.zoom);
  }

  zoomChanged(newZoom: number) {
    this.zoom = newZoom;
    this.upadateMapURL(this.center_coordinates, newZoom);
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

    this._dbService.getPreviewSpotsForTiles(zoom, tilesToLoad).subscribe(
      (spots) => {
        if (spots.length > 0) {
          let tile = spots[0].data.tile_coordinates.z16;
          this.loadedSpots[`z${zoom}_${tile.x}_${tile.y}`] = spots;
          console.log("new sposts laoded:");
          console.log(spots);
          this.updateVisibleDots();
        }
      },
      (error) => {
        console.error(error);
      },
      () => {} // complete
    );
  }

  updateVisibleDots() {
    const allSpots = [].concat.apply(
      [],
      Object.values<Spot.Class[]>(this.loadedSpots)
    );

    // temporary: // TODO REMOVE
    this.searchSpots = allSpots;

    this.visibleDots = allSpots.map((spot) => {
      return {
        location: {
          latitude: spot.data.location.latitude,
          longitude: spot.data.location.longitude,
        },
        value: 1,
      };
    });
  }

  toggleMapStyle() {
    if (
      this.map.mapTypeId.toLowerCase() ===
      google.maps.MapTypeId.ROADMAP.toLowerCase()
    ) {
      // if it is equal to roadmap, toggle to satellite
      this.mapStyle = google.maps.MapTypeId.SATELLITE;
    } else {
      // otherwise toggle back to roadmap
      this.mapStyle = google.maps.MapTypeId.ROADMAP;
    }
  }

  openSpot(spot: Spot.Class) {
    // Maybe just opened spot
    this.selectedSpot = spot;
    this.upadateMapURL(this.center_coordinates, this.zoom);
  }

  createSpot() {
    console.log("Create Spot");

    this.selectedSpot = new Spot.Class(
      "", // The id needs to be empty for the spot to be recognized and created in the database
      {
        name: "New Spot",
        location: new firebase.default.firestore.GeoPoint(
          this.center_coordinates.lat,
          this.center_coordinates.lng
        ),
      }
    );

    this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(this.selectedSpot);

    // sets the map and the spot to edit mode
    this.editingBounds = true;
  }

  getPathsFromSpotPolygon() {
    this.polygons.forEach((polygon) => {
      if (polygon?.editable) {
        polygon
          .getPaths()
          .then((val) => {
            // Convert LatLng[][] to LatLngLiteral[][]
            let paths: Array<Array<google.maps.LatLngLiteral>> = [];
            paths[0] = val[0].map((v, i, arr) => {
              return { lat: v.lat(), lng: v.lng() };
            });

            // this sets the paths for the selected spot and also sets the bounds for the spot data structure.
            this.selectedSpot.paths = paths;

            if (this.spotDetail) {
              this.spotDetail.save();
            }
            // If the sidepanel is not open while editing, it might not be able to save.
          })
          .catch((reason) => {
            console.error(reason);
          });
      }
    });

    // If we get here, no editable polygon was found, a spot without bounds was saved
    this.spotDetail.save();
  }

  loadSpotsForTiles(tilesToLoad: { x: number; y: number }[]) {
    this._dbService.getSpotsForTiles(tilesToLoad).subscribe(
      (spots) => {
        if (spots.length > 0) {
          let tile = spots[0].data.tile_coordinates.z16;
          this.loadedSpots[`z${16}_${tile.x}_${tile.y}`] = spots;
          this.updateVisibleSpots();
        }
      },
      (error) => {
        console.error(error);
      },
      () => {} // complete
    );
  }

  spotMarkerMoved(event: google.maps.MouseEvent) {
    if (this.selectedSpot) {
      let latLng = event.latLng;
      this.selectedSpot.location = { lat: latLng.lat(), lng: latLng.lng() };
    } else {
      console.error(
        "User somehow could change the spot marker position without having a spot selected"
      );
    }
  }
  closeSpot() {
    this.selectedSpot = null;
    this.upadateMapURL(this.center_coordinates, this.zoom);
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
    console.log("made inital bounds");
    this.selectedSpot.paths = _paths;

    this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(this.selectedSpot);
  }

  /**
   * Add a newly created spot (before first save) to the loaded spots for nice display. It can be identified by having its ID set to empty string
   * @param newSpot The newly created spot class.
   */
  addOrUpdateNewSpotToLoadedSpotsAndUpdate(newSpot: Spot.Class) {
    // Get the tile coordinates to save in loaded spots
    let tile = MapHelper.getTileCoordinates(newSpot.location, 16);

    // Get all the spots on the same z=16 tile
    let spots: Spot.Class[] =
      this.loadedSpots[`z${16}_${tile.x}_${tile.y}`] || [];

    // Check if this new spot already exists in the loaded spots.
    let spot = spots.find((v, i, obj) => {
      return v.id === "";
    });

    if (spot) {
      // The spot exists and should be updated
      // get the index in the array
      let spotIndex = spots.indexOf(spot);

      // Update the spot
      this.loadedSpots[`z${16}_${tile.x}_${tile.y}`][
        spotIndex
      ] = this.selectedSpot;
    } else {
      // the spot does not exist
      this.loadedSpots[`z${16}_${tile.x}_${tile.y}`].push(this.selectedSpot);
    }

    // update the map to show the new spot on the loaded spots array.
    this.updateVisibleSpots();
  }

  /**
   * This function is used if the new spot was deleted, discarded or never saved. It removes the first spot it finds without an id.
   */
  removeNewSpotFromLoadedSpotsAndUpdate() {
    // TODO
  }

  /**
   * This funciton is used if the new spot was saved and now has an id. It replaces the first spot it finds with no ID with the newSaveSpot
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
