import { LatLngLiteral } from "@agm/core";
import { DbDate, DbLocation } from "./Interfaces";
import * as firebase from "firebase";

export module Spot {
  export class Class {
    constructor(private _id: string, private _data: Spot.Schema) {
      this._paths = this.makePathsFromBounds(_data.bounds);
    }

    private _paths = [];
    get paths() {
      return this._paths;
    }
    set paths(paths) {
      this._paths = paths;
      this._data.bounds = this.makeBoundsFromPaths(paths);
    }

    get id() {
      return this._id;
    }

    get data() {
      return this._data;
    }

    private makePathsFromBounds(
      bounds: firebase.firestore.GeoPoint[]
    ): Array<Array<LatLngLiteral>> {
      let path: Array<Array<LatLngLiteral>> = [[]];

      for (let point of bounds) {
        path[0].push({
          lat: point.latitude || point["_lat"],
          lng: point.longitude || point["_long"],
        });
      }
      return path;
    }

    private makeBoundsFromPaths(
      path: Array<Array<LatLngLiteral>>
    ): firebase.firestore.GeoPoint[] {
      let bounds: firebase.firestore.GeoPoint[] = [];

      for (let point of path[0]) {
        bounds.push(new firebase.firestore.GeoPoint(point.lat, point.lng));
      }

      return bounds;
    }
  }

  export interface Schema {
    name: string;
    location: firebase.firestore.GeoPoint;
    tile_coordinates: {
      z2: { x: number; y: number };
      z4: { x: number; y: number };
      z6: { x: number; y: number };
      z8: { x: number; y: number };
      z10: { x: number; y: number };
      z12: { x: number; y: number };
      z14: { x: number; y: number };
      z16: { x: number; y: number };
    };
    occupied_z16_tiles: { x: number; y: number }[];
    image_src: string;
    type: string;
    area: string;
    rating: number;

    bounds: firebase.firestore.GeoPoint[];

    time_created: firebase.firestore.Timestamp;
    time_updated: { seconds: number; nanoseconds: number };
  }
}
