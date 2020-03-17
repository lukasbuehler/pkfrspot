import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { map_style } from "./map_style";

import {} from "googlemaps";
import { DatabaseService } from "../database.service";
import {
  LatLngLiteral,
  AgmMap,
  AgmPolygon,
  PolygonManager,
  LatLngBounds,
  LatLng
} from "@agm/core";
import { MapStyle } from "src/scripts/MapStyle";
import { Spot } from "src/scripts/db/Spot";
import { MapHelper } from "./map_helper";

@Component({
  selector: "app-map-page",
  templateUrl: "./map-page.component.html",
  styleUrls: ["./map-page.component.scss"]
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
  start_coordinates = {
    lat: 48.8517386,
    lng: 2.298386
  };

  private _zoom: number = 3;
  private readonly _loadSpotsZoomLevel: number = 16;

  visibleSpots: Spot.Class[] = [];
  searchSpots: Spot.Class[] = [];
  loadedSpots: any[] = []; // is a map of tile coords to spot arrays

  private _northEastTileCoords: google.maps.Point;
  private _southWestTileCoords: google.maps.Point;

  constructor(private _dbService: DatabaseService) {}

  ngOnInit() {}

  clickedMap(coords) {
    console.log(coords);
    this.droppedMarkerLocation = coords.coords;
    console.log(MapHelper.getTileCoordinates(coords.coords, this._zoom));
  }

  zoomChanged(zoomLevel: number) {
    this._zoom = zoomLevel;
  }

  boundsChanged(bounds: LatLngBounds) {
    let zoomLevel = this._zoom;
    if (zoomLevel >= this._loadSpotsZoomLevel) {
      // inside this zoom level we are constantly loading spots if new tiles become visible

      let northEastLiteral: LatLngLiteral = {
        lat: bounds.getNorthEast().lat(),
        lng: bounds.getNorthEast().lng()
      };
      let southWestLiteral: LatLngLiteral = {
        lat: bounds.getSouthWest().lat(),
        lng: bounds.getSouthWest().lng()
      };

      let northEastTileCoords = MapHelper.getTileCoordinates(
        northEastLiteral,
        this._loadSpotsZoomLevel
      );
      let southWestTileCoords = MapHelper.getTileCoordinates(
        southWestLiteral,
        this._loadSpotsZoomLevel
      );

      this._northEastTileCoords = northEastTileCoords;
      this._southWestTileCoords = southWestTileCoords;

      this.loadNewSpotOnTiles(northEastTileCoords, southWestTileCoords);
      this.updateVisibleSpots();
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
      let x = this._southWestTileCoords.x;
      x <= this._northEastTileCoords.x;
      x++
    ) {
      for (
        let y = this._northEastTileCoords.y;
        y <= this._southWestTileCoords.y;
        y++
      ) {
        // here we go through all the x,y pairs for every visible tile on screen right now.

        if (this.loadedSpots[`${x}_${y}`]) {
          this.visibleSpots = this.visibleSpots.concat(
            this.loadedSpots[`${x}_${y}`]
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
        if (!this.loadedSpots[`${x}_${y}`]) {
          // the tile was not loaded before

          // mark this tile as loaded, will be filled after the data was
          // fetched. This prevents multiple fetches for the same tile
          // !([]) is false, !(undefined) is true
          // this way it wont be loaded twice
          this.loadedSpots[`${x}_${y}`] = [];
          tilesToLoad.push({ x: x, y: y });
        }
      }
    }

    this.loadSpotsForTiles(tilesToLoad);
  }

  toggleMapStyle() {
    if (this.map.mapTypeId === MapStyle.Simple) {
      this.mapStyle = MapStyle.Satellite;
    } else {
      this.mapStyle = MapStyle.Simple;
    }
  }

  clickedSpot(spot: Spot.Class) {
    this.selectedSpot = spot;
    this.editingPaths = spot.paths;
  }

  saveBoundsEdit() {
    this.selectedSpot.paths = this.editingPaths;
    this._dbService.setSpot(this.selectedSpot).subscribe(
      value => {
        console.log("Successful save!");
        console.log(value);

        this.editingBounds = false;
      },
      error => {
        console.error(error);
      },
      () => {}
    );
  }

  createSpot() {
    console.log("Create Spot");
  }

  pathsChanged(pathsChangedEvent) {
    console.log(pathsChangedEvent);

    this.editingPaths = pathsChangedEvent.newArr;
  }

  loadSpotsForTiles(tilesToLoad: { x: number; y: number }[]) {
    this._dbService.getSpotsForTiles(tilesToLoad).subscribe(
      spots => {
        if (spots.length > 0) {
          let tile = spots[0].data.tile_16;
          this.loadedSpots[`${tile.x}_${tile.y}`] = spots;
          this.updateVisibleSpots();
        }
      },
      error => {
        console.error(error);
      },
      () => {} // complete
    );
  }
}
