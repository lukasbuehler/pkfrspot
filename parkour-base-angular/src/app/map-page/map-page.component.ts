import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { map_style } from "./map_style";

import * as firebase from "firebase";

import {} from "googlemaps";
import { DatabaseService } from "../database.service";
import {
  LatLngLiteral,
  AgmMap,
  AgmPolygon,
  PolygonManager,
  LatLngBounds,
  LatLng,
  MouseEvent,
} from "@agm/core";
import { MapStyle } from "src/scripts/MapStyle";
import { Spot } from "src/scripts/db/Spot";
import { MapHelper } from "../../scripts/map_helper";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";

@Component({
  selector: "app-map-page",
  templateUrl: "./map-page.component.html",
  styleUrls: ["./map-page.component.scss"],
})
export class MapPageComponent implements OnInit {
  @ViewChild("map", { static: true }) map: AgmMap;
  mapStyle: MapStyle = MapStyle.Simple;
  mapStylesConfig = map_style;
  spotPolygons: AgmPolygon[] = [];

  editingBounds: boolean = false;
  selectedSpot: Spot.Class = null;
  editingPaths: Array<Array<LatLngLiteral>> = [];

  droppedMarkerLocation = null;

  // The default coordinates are Paris, the origin of parkour.
  // modiying this resets the map
  readonly start_coordinates: LatLngLiteral = {
    lat: 48.8517386,
    lng: 2.298386,
  };

  // these are updated from user input
  center_coordinates: LatLngLiteral = {
    lat: this.start_coordinates.lat,
    lng: this.start_coordinates.lat,
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
    let zoom = this.route.snapshot.queryParamMap.get("z") || null;

    if (spotId) {
      this._dbService.getSpotById(spotId).subscribe((spot) => {
        console.log("Done loading spot");
        this.openSpot(spot);
        if (lat && lng && zoom && lat) {
          let _lat = Number(lat);
          let _lng = Number(lng);
          if (!(_lat === 0 && _lng === 0)) {
            this.start_coordinates.lat = _lat;
            this.start_coordinates.lng = _lng;
            this.zoom = Number(zoom);
          }
        } else {
          this.start_coordinates.lat = spot.data.location.latitude;
          this.start_coordinates.lng = spot.data.location.longitude;
          this.zoom = 18;
        }
      });
      console.log("Loading spot " + spotId);
      // Show loading spot to open
      // TODO snackbar
    }

    if (lat && lng) {
      this.start_coordinates.lat = Number(lat);
      this.start_coordinates.lng = Number(lng);
      this.zoom = Number(zoom);
    }
  }

  clickedMap(coords) {
    console.log(coords);
    this.droppedMarkerLocation = coords.coords;
    console.log(MapHelper.getTileCoordinates(coords.coords, this.zoom));
  }

  boundsChanged(bounds: LatLngBounds) {
    let zoomLevel = this.zoom;

    let northEastLiteral: LatLngLiteral = {
      lat: bounds.getNorthEast().lat(),
      lng: bounds.getNorthEast().lng(),
    };
    let southWestLiteral: LatLngLiteral = {
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

  centerChanged(center: LatLngLiteral) {
    this.center_coordinates.lat = center.lat;
    this.center_coordinates.lng = center.lng;
    this.upadateMapURL(center, this.zoom);
  }

  zoomChanged(newZoom: number) {
    this.zoom = newZoom;
    this.upadateMapURL(this.center_coordinates, newZoom);
  }

  upadateMapURL(center: LatLngLiteral, zoom: number) {
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
    if (this.map.mapTypeId === MapStyle.Simple) {
      this.mapStyle = MapStyle.Satellite;
    } else {
      this.mapStyle = MapStyle.Simple;
    }
  }

  openSpot(spot: Spot.Class) {
    // Maybe just opened spot
    this.selectedSpot = spot;
    this.editingPaths = spot.paths;
    this.upadateMapURL(this.center_coordinates, this.zoom);
  }

  saveBoundsEdit() {
    this.selectedSpot.paths = this.editingPaths;
    this._dbService.setSpot(this.selectedSpot).subscribe(
      (value) => {
        console.log("Successful save!");
        console.log(value);

        this.editingBounds = false;
      },
      (error) => {
        console.error(error);
      },
      () => {}
    );
  }

  createSpot() {
    console.log("Create Spot");

    this.selectedSpot = new Spot.Class("", {
      name: "New Spot",
      location: new firebase.firestore.GeoPoint(
        this.center_coordinates.lat,
        this.center_coordinates.lng
      ),
    });
    this.editingBounds = true;
  }

  pathsChanged(pathsChangedEvent) {
    console.log(pathsChangedEvent);

    this.editingPaths = pathsChangedEvent.newArr;
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

  editSpot() {
    this.editingBounds = true;
  }
  stopEditingSpot() {
    this.editingBounds = false;
  }

  spotMarkerMoved(event: MouseEvent) {
    if (this.selectedSpot) {
      this.selectedSpot.location = event.coords;
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
}
