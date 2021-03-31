import {
  ContributedMedia,
  DbDate,
  DbLocation,
  LocaleMap,
  MediaType,
} from "./Interfaces";
import * as firebase from "firebase";
import { MapHelper } from "../map_helper";
import { DatabaseService } from "src/app/database.service";
import { Observable } from "rxjs";

export module Spot {
  export class Class {
    constructor(
      private _id: string,
      private _data: Spot.Schema,
      isNotForMap?: boolean
    ) {
      if (this.hasBounds()) {
        this._paths = this._makePathsFromBounds(_data.bounds);
      }
      if (_data.location && !isNotForMap) {
        this.setTileCoordinates();
      }
    }

    get name(): string {
      return this._data.name.de_CH || "Unnamed";
    }
    set name(newName) {
      this._data.name.de_CH = newName;
    }

    get isMiniSpot(): boolean {
      return this._data.isMiniSpot;
    }

    get rating(): number {
      return this._data.rating;
    }

    get description(): string {
      return this._data.description?.en_GB || "Description goes here";
    }

    get hasMedia() {
      return this._data.media && this._data.media.length > 0;
    }

    get previewImage(): string {
      if (this.hasMedia && this._data.media[0].type === MediaType.Image) {
        return this.getMediaByIndex(0).src;
      }
      return "";
    }

    get media() {
      return this._data.media;
    }

    getMediaByIndex(index: number) {
      return this._data.media[index];
    }

    public addMedia(src: string, type: MediaType, uid: string) {
      if (!this._data.media) {
        this._data.media = [];
      }

      this._data.media.push({ src: src, type: type, uid: uid });
    }

    get type(): string {
      return this._data.type;
    }
    set type(newType) {
      this._data.type = newType;
    }

    get area(): string {
      return this._data.area;
    }
    set area(newArea) {
      this._data.area = newArea;
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

    get location(): google.maps.LatLngLiteral {
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
    name: LocaleMap;

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

    isMiniSpot?: boolean;
    rating?: number;
    description?: LocaleMap;
    media?: ContributedMedia[];

    type?: string;
    area?: string;

    bounds?: firebase.default.firestore.GeoPoint[];

    time_created?: firebase.default.firestore.Timestamp;
    time_updated?: { seconds: number; nanoseconds: number };
  }

  export enum Types {
    Playground = "playground",
    Park = "park",
    PkPark = "parkour park",
    Gym = "parkour gym",
    School = "school",
    UniversityCampus = "university campus",
    Other = "other",
  }

  export enum Areas {
    Public = "public",
    Residential = "residential",
    Commercial = "commercial",
    Private = "private",
    Other = "other",
  }
}
