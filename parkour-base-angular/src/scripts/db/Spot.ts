import {
  ContributedMedia,
  LocaleMap,
  MediaType,
} from "./Interfaces";
import * as firebase from "firebase";
import { MapHelper } from "../map_helper";
import { DatabaseService } from "src/app/database.service";
import { StorageFolder, StorageService } from "src/app/storage.service";

export namespace Spot {
  export class Class {
    public readonly id: string = "";
    public name: string = "";
    public location: google.maps.LatLngLiteral = null;
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

    public address: AddressSchema;

    constructor(
      private _id: string,
      private _data: Spot.Schema,
      private _isNotForMap: boolean = false
    ) {
      this.id = _id;
      this._updateData();
    }

    private _updateData() {
      this.name = this._data.name?.de_CH || "Unnamed"; // TODO multilang
      this.location = { lat: this._data.location.latitude, lng: this._data.location.longitude };
      this.isMiniSpot = this._data.isMiniSpot;
      this.rating = this._data.rating;
      this.description =
        this._data.description?.en_GB || ""; // TODO multiland

      // Media
      this.hasMedia = this._data.media && this._data.media.length > 0;
      if (this.hasMedia && this._data.media[0].type === MediaType.Image) {
        this.previewImage = this.getMediaByIndex(0).src;
      }
      this.media = this._data.media;

      this.type = this._data.type;
      this.area = this._data.area;

      this.address = this._data.address;

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

    public addMedia(
      _dbService: DatabaseService,
      src: string,
      type: MediaType,
      uid: string
    ) {
      if (!this._data.media) {
        this._data.media = [];
      }

      this._data.media.push({ src: src, type: type, uid: uid });
      this._updateMedia(_dbService);
    }

    public setMedia(
      media: ContributedMedia[],
      _dbService: DatabaseService,
      _storageService: StorageService
    ) {
      for (let mediaObj of this._data.media) {
        if (
          media.findIndex((val) => {
            return val.src === mediaObj.src;
          }) < 0 &&
          mediaObj.type === MediaType.Image
        ) {
          // this image was deleted
          let filenameRegex = RegExp(
            /(?:spot_pictures)(?:\/|%2F)(.+?)(?:\?.*)?$/
          );
          let storageFilenameMatch = mediaObj.src.match(filenameRegex);
          if (storageFilenameMatch[1]) {
            let storageFilename = storageFilenameMatch[1] || "";

            if (storageFilename) {
              _storageService
                .deleteFromStorage(StorageFolder.SpotPictures, storageFilename)
                .then(
                  () => {
                    // deleting successful
                    console.log(
                      "successfully deleted file: " + storageFilename
                    );
                  },
                  (error) => {
                    console.error(error);
                  }
                );
            } else {
              console.error(
                "Couldn't resolve storage filename when setting media"
              );
            }
          } else {
            console.error("Regex Match doesn't resolve a filename");
            console.log(storageFilenameMatch);
          }
        }
      }

      this._data.media = media;
      this._updateMedia(_dbService);
    }

    private _updateMedia(_dbService: DatabaseService) {
      this._updateData();
      _dbService.updateSpot(this._id, { media: this._data.media });
    }

    setType(newType: string) {
      this._data.type = newType;
      this._updateData();
    }

    setArea(newArea: string) {
      this._data.area = newArea;
      this._updateData();
    }

    setDescription(newDescription: string, langCode: string = "en_GB") {
      if(!this._data.description)
      {
        this._data.description = {};
      }

      this._data.description[langCode] = newDescription;
      this._updateData();
    }

    setPaths(paths) {
      this.paths = paths;
      this._data.bounds = this._makeBoundsFromPaths(paths);
    }

    setAddress(addressObj) {
      this.address = addressObj;
      this._data.address = addressObj;
      this._updateData();
    }

    setLocation(location: google.maps.LatLngLiteral) {
      this._data.location = new firebase.default.firestore.GeoPoint(
        location.lat,
        location.lng
      );
      this.setTileCoordinates(); // update tile coords
      this._updateData(); // reflect changes
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

  export interface AddressSchema {
    route?: {
      short: string;
      long: string;
    };
    street_number?: number;
    neighborhood?: string;
    city?: string;
    postal_code?: number;
    county?: string;
    state?: {
      short?: string;
      long: string;
    };
    country: {
      short: string; // alpha 2
      long: string;
    };
    formatted: string;
  }

  export function clone(spot: Class) {
    const dataCopy = JSON.parse(JSON.stringify(spot.data));
    return new Class(spot.id, dataCopy);
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

    address?: AddressSchema;

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
