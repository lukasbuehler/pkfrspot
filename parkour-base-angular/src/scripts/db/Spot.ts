import { LatLngLiteral } from "@agm/core";
import { DbDate, DbLocation } from "./Interfaces";

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
      bounds: DbLocation[]
    ): Array<Array<LatLngLiteral>> {
      let path: Array<Array<LatLngLiteral>> = [[]];

      for (let point of bounds) {
        path[0].push({ lat: point._lat, lng: point._long });
      }
      return path;
    }

    private makeBoundsFromPaths(
      path: Array<Array<LatLngLiteral>>
    ): DbLocation[] {
      let bounds: DbLocation[] = [];

      for (let point of path[0]) {
        bounds.push({ _lat: point.lat, _long: point.lng });
      }

      return bounds;
    }
  }

  export interface Schema {
    name: string;
    location: DbLocation;
    address: string;
    image_src: string;
    type: string;

    bounds: DbLocation[];

    time_created: DbDate;
    time_updated: { seconds: number; nanoseconds: number };
  }
}
