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
    public readonly id: string = "";
    public name: string = "";
    public isMiniSpot: boolean = false;
    public rating: number = null;
    public description: string = "";
    public hasMedia: boolean = false;
    public previewImage: string = "";
    public media: ContributedMedia[] = null;
    public type: string = "";
    public area: string = "";

    public paths = [];

    public data: Spot.Schema = null;

    constructor(
      private _id: string,
      private _data: Spot.Schema,
      private _isNotForMap?: boolean
    ) {
      this.id = _id;
      this._updateData();
    }

    private _updateData() {
      this.name = this._data.name?.de_CH || "Unnamed";
      this.isMiniSpot = this._data.isMiniSpot;
      this.rating = this._data.rating;
      this.description =
        this._data.description?.en_GB || "Description goes here";

      // Media
      this.hasMedia = this._data.media && this._data.media.length > 0;
      if (this.hasMedia && this._data.media[0].type === MediaType.Image) {
        this.previewImage = this.getMediaByIndex(0).src;
      }
      this.media = this._data.media;

      this.type = this._data.type;
      this.area = this._data.area;

      this.data = this._data;

      if (this.hasBounds()) {
        this.paths = this._makePathsFromBounds(this._data.bounds);
      }
      if (this._data.location && !this._isNotForMap) {
        this.setTileCoordinates();
      }
    }

    public setName(newName: string) {
      this._data.name.de_CH = newName;
      this._updateData();
    }

    public getMediaByIndex(index: number) {
      return this._data.media[index];
    }

    public addMedia(src: string, type: MediaType, uid: string) {
      if (!this._data.media) {
        this._data.media = [];
      }

      this._data.media.push({ src: src, type: type, uid: uid });
      this._updateData();
    }

    setType(newType) {
      this._data.type = newType;
    }

    setArea(newArea) {
      this._data.area = newArea;
    }

    setPpaths(paths) {
      this.paths = paths;
      this._data.bounds = this._makeBoundsFromPaths(paths);
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
