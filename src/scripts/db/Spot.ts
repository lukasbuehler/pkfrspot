import { ContributedMedia, LocaleMap, MediaType } from "./Interfaces";
import { MapHelpers } from "../MapHelpers";
import { DatabaseService } from "../../app/database.service";
import { StorageFolder, StorageService } from "../../app/storage.service";
import { environment } from "../../environments/environment";
import { GeoPoint } from "firebase/firestore";

interface GeoPointLiteral {
  latitude: number;
  longitude: number;
}

export namespace Spot {
  export class Class {
    private _locale: string = "de_CH"; // TODO: don't fix

    public get id(): string {
      return this._id;
    }

    public get name(): string {
      if (this._data.name) {
        return this._data.name[this._locale] || "";
      }
      return ""; // TODO add default names for all locales;
    }
    public set name(newName: string) {
      if (!this._data.name) {
        this._data.name = {};
      }
      this._data.name[this._locale] = newName;
    }

    private _location: google.maps.LatLngLiteral;
    public get location(): google.maps.LatLngLiteral {
      return this._location;
    }
    public set location(newLocation: google.maps.LatLngLiteral) {
      console.log("setting location");
      this._location = newLocation;
      this._data.location = new GeoPoint(
        newLocation.lat,
        newLocation.lng
      ).toJSON();
      this._data.tile_coordinates = this._generateTileCoordinates(
        this._location
      ); // update tile coords
    }

    public get isMiniSpot(): boolean {
      return this._data.isMiniSpot;
    }

    public get rating(): number {
      return this._data.rating;
    }

    public get description(): string {
      if (this._data.description) {
        return this._data.description[this._locale];
      }
      return "";
    }
    public set description(newDescription: string) {
      if (!this._data.description) {
        this._data.description = {};
      }
      this._data.description[this._locale] = newDescription;
    }

    public get hasMedia(): boolean {
      return this.media && this.media.length > 0;
    }

    public get previewImage(): string {
      const previewSize: string = "400x400";

      if (this.hasMedia && this.media[0].type === MediaType.Image) {
        let media = this.getMediaByIndex(0);
        let url = media.src;
        if (media.uid) {
          // has uid: is from a user.
          url = url.replace(/\?/, `_${previewSize}?`);
        }

        return url;
      }
      return "";
    }

    public get media(): ContributedMedia[] {
      return [].concat(this._data.media ?? [], this._streetview ?? []);
    }

    public get type(): string {
      return this._data.type;
    }
    public set type(type: string) {
      this._data.type = type;
    }

    public get area(): string {
      return this._data.area;
    }
    public set area(area: string) {
      this._data.area = area;
    }

    private _paths: google.maps.LatLngLiteral[][];
    public get paths(): google.maps.LatLngLiteral[][] {
      return this._paths;
    }
    public set paths(paths: google.maps.LatLngLiteral[][]) {
      this._paths = paths;
      this._data.bounds = this._makeBoundsFromPaths(paths);
    }

    public get address(): AddressSchema {
      return this._data.address;
    }
    public set address(address: AddressSchema) {
      this._data.address = address;
    }

    public get tileCoordinates() {
      return this._data.tile_coordinates;
    }

    public get data(): Schema {
      return this._data;
    }

    private _data: Schema;
    private _streetview: ContributedMedia;

    constructor(private _id: string, _data: Partial<Schema>) {
      this._data = _data as Schema;

      this._data.bounds = _data.bounds ?? [];

      if (_data.location["_lat"] && _data.location["_long"]) {
        // convert LatLongLiteral to GeoPoint literal
        this._data.location = new GeoPoint(
          _data.location["_lat"],
          _data.location["_long"]
        ).toJSON();
      }

      this._paths = this._makePathsFromBounds(this._data.bounds);

      this._location = {
        lat: this._data.location.latitude,
        lng: this._data.location.longitude,
      };
      this._data.tile_coordinates = this._generateTileCoordinates(
        this._location
      );

      // street view metadata
      fetch(
        `https://maps.googleapis.com/maps/api/streetview/metadata?size=800x800&location=${
          this._location.lat
        },${
          this._location.lng
        }&fov=${120}&return_error_code=${true}&source=outdoor&key=${
          environment.keys.firebaseConfig.apiKey
        }`
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.status !== "ZERO_RESULTS") {
            // street view media
            const streetView: ContributedMedia = {
              src: `https://maps.googleapis.com/maps/api/streetview?size=800x800&location=${
                this._location.lat
              },${
                this._location.lng
              }&fov=${120}&return_error_code=${true}&source=outdoor&key=${
                environment.keys.firebaseConfig.apiKey
              }`,
              type: MediaType.Image,
              uid: "",
              origin: "streetview",
            };

            this._streetview = streetView;
          }
        });
    }

    public getMediaByIndex(index: number): ContributedMedia {
      return this.media[index];
    }

    public getReadableLocation(): string {
      const lat = Math.abs(this._location.lat);
      const lng = Math.abs(this._location.lng);
      const latDegrees = Math.floor(lat);
      const latMinutes = Math.floor((lat - latDegrees) * 60);
      const latSeconds =
        Math.round((lat - latDegrees - latMinutes / 60) * 36000) / 10;
      const lngDegrees = Math.floor(lng);
      const lngMinutes = Math.floor((lng - lngDegrees) * 60);
      const lngSeconds =
        Math.round((lng - lngDegrees - lngMinutes / 60) * 36000) / 10;
      return `${latDegrees}° ${latMinutes}' ${latSeconds}'' ${
        lat >= 0 ? "N" : "S"
      }, ${lngDegrees}° ${lngMinutes}' ${lngSeconds}'' ${lng >= 0 ? "E" : "W"}`;
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
      _dbService.updateSpot(this._id, { media: this._data.media });
    }

    public hasBounds() {
      return !!(this._data.bounds?.length > 0);
    }

    private _generateTileCoordinates(
      location: google.maps.LatLngLiteral
    ): Schema["tile_coordinates"] {
      let tile_coordinates: Partial<Schema["tile_coordinates"]> = {
        z16: MapHelpers.getTileCoordinatesForLocationAndZoom(location, 16),
      };

      for (let zoom = 16; zoom >= 2; zoom -= 2) {
        tile_coordinates[`z${zoom}` as keyof Schema["tile_coordinates"]] = {
          x: tile_coordinates.z16.x >> (16 - zoom),
          y: tile_coordinates.z16.y >> (16 - zoom),
        };
      }

      return tile_coordinates as Schema["tile_coordinates"];
    }

    private _makePathsFromBounds(
      bounds: GeoPointLiteral[]
    ): Array<Array<google.maps.LatLngLiteral>> {
      if (!bounds) return [];

      return [
        bounds.map((point) => {
          return {
            lat: point.latitude || point.latitude,
            lng: point.longitude || point.longitude,
          };
        }),
      ];
    }

    private _makeBoundsFromPaths(
      paths: Array<Array<google.maps.LatLngLiteral>>
    ): GeoPoint[] {
      if (!paths || paths.length === 0) return [];

      return paths[0].map((point) => {
        return new GeoPoint(point.lat, point.lng);
      });
    }

    public clone() {
      const dataCopy = JSON.parse(JSON.stringify(this._data));
      return new Class(this.id, dataCopy);
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

  export interface Schema {
    name: LocaleMap;

    location: GeoPointLiteral;

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

    isMiniSpot?: boolean;
    rating?: number;
    description?: LocaleMap;
    media?: ContributedMedia[];

    type?: string;
    area?: string;

    address?: AddressSchema;

    bounds?: GeoPointLiteral[];

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
