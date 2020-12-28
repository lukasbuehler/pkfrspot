import { DbDate, DbLocation } from "./Interfaces";
import * as firebase from "firebase";
import { MapHelper } from "../map_helper";

export module Spot {
  export class Class {
    constructor(private _id: string, private _data: Spot.Schema) {
      if (this.hasBounds()) {
        this._paths = this._makePathsFromBounds(_data.bounds);
      }
      if (_data.location) {
        this.setTileCoordinates();
      }
    }

    private _paths = [];
    get paths() {
      return this._paths;
    }
    set paths(paths) {
      this._paths = paths;
      this._data.bounds = this._makeBoundsFromPaths(paths);
    }

    get id() {
      return this._id;
    }

    get data() {
      return this._data;
    }
    set data(data) {
      // TODO Remove?
      this._data = data;
      if (this.data.location) {
        this.setTileCoordinates();
      }
    }
    get location() {
      const point = this._data.location;
      return { lat: point.latitude, lng: point.longitude };
    }
    set location(location: google.maps.LatLngLiteral) {
      this._data.location = new firebase.default.firestore.GeoPoint(
        location.lat,
        location.lng
      );
      // update tile coords
      this.setTileCoordinates();
    }

    public hasBounds() {
      return !!this._data.bounds;
    }

    public addNewImage(link: string) {
      this._data.image_src = link;
    }

    public setTileCoordinates() {
      if (!this._data.tile_coordinates) {
        this._data.tile_coordinates = {};
      }
      this._data.tile_coordinates.z16 = MapHelper.getTileCoordinates(
        this.location,
        16
      );
      for (let zoom = 16; zoom >= 2; zoom -= 2) {
        this._data.tile_coordinates[`z${zoom}`] = {
          x: this._data.tile_coordinates.z16.x >> (16 - zoom),
          y: this._data.tile_coordinates.z16.y >> (16 - zoom),
        };
      }
    }

    private _makePathsFromBounds(
      bounds: firebase.default.firestore.GeoPoint[]
    ): Array<Array<google.maps.LatLngLiteral>> {
      let path: Array<Array<google.maps.LatLngLiteral>> = [[]];

      for (let point of bounds) {
        path[0].push({
          lat: point.latitude || point["_lat"],
          lng: point.longitude || point["_long"],
        });
      }
      return path;
    }

    private _makeBoundsFromPaths(
      path: Array<Array<google.maps.LatLngLiteral>>
    ): firebase.default.firestore.GeoPoint[] {
      let bounds: firebase.default.firestore.GeoPoint[] = [];

      for (let point of path[0]) {
        bounds.push(
          new firebase.default.firestore.GeoPoint(point.lat, point.lng)
        );
      }

      return bounds;
    }
  }

  export interface Schema {
    name: string;
    location: firebase.default.firestore.GeoPoint;
    tile_coordinates?: {
      z2?: { x: number; y: number };
      z4?: { x: number; y: number };
      z6?: { x: number; y: number };
      z8?: { x: number; y: number };
      z10?: { x: number; y: number };
      z12?: { x: number; y: number };
      z14?: { x: number; y: number };
      z16?: { x: number; y: number };
    };
    occupied_z16_tiles?: { x: number; y: number }[];
    image_src?: string;
    type?: string;
    area?: string;
    rating?: number;

    bounds?: firebase.default.firestore.GeoPoint[];

    time_created?: firebase.default.firestore.Timestamp;
    time_updated?: { seconds: number; nanoseconds: number };
  }

  export enum Types {
    Playground = "playground",
    Park = "park",
    PkPark = "parkour park",
    Gym = "parkour gym",
    Other = "other",
  }

  export enum Areas {
    Public = "public",
    Commercial = "commercial",
    Private = "private",
    Other = "other",
  }
}
