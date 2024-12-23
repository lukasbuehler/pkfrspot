import {
  ContributedMedia,
  LocaleMap,
  MediaType,
  AmenitiesMap,
  AmenityNames,
  AmenityIcons,
  AmenitiesOrder,
} from "./Interfaces";
import { MapHelpers } from "../MapHelpers";
import { SpotsService } from "../../app/services/firestore-services/spots.service";
import {
  StorageFolder,
  StorageService,
} from "../../app/services/storage.service";
import { environment } from "../../environments/environment";
import { GeoPoint } from "firebase/firestore";
import { SpotReview } from "./SpotReview.js";

const defaultSpotNames: LocaleMap = {
  en: "Unnamed Spot",
  "en-US": "Unnamed Spot",
  "en-GB": "Unnamed Spot",
  de: "Unbenannter Spot",
  "de-DE": "Unbenannter Spot",
  "de-CH": "Unbenännte Spot",
};

export interface SpotPreviewData {
  name: string;
  id: string;
  locality: string;
  imageSrc: string;
  isIconic: boolean;
  rating?: number; // whole number 1-10
}

export namespace Spot {
  export class Class {
    public get id(): string {
      return this._id;
    }

    updateId(newId: string) {
      this._id = newId;
    }

    public getName(locale: string): string {
      if (this._data.name) {
        const nameLocales: string[] = Object.keys(this._data.name);
        if (nameLocales.length > 0) {
          if (nameLocales.includes(locale)) {
            return this._data.name[locale];
          } else if (nameLocales.includes(locale.split("-")[0])) {
            return this._data.name[locale.split("-")[0]];
          } else if (nameLocales.includes("en")) {
            return this._data.name["en"];
          } else {
            return this._data.name[nameLocales[0]];
          }
        }
      }
      return defaultSpotNames[locale];
    }

    public setName(newName: string, locale: string) {
      if (!this._data.name) {
        this._data.name = {};
      }
      this._data.name[locale] = newName;
    }

    private _location: google.maps.LatLngLiteral;
    public get location(): google.maps.LatLngLiteral {
      return this._location;
    }
    public set location(newLocation: google.maps.LatLngLiteral) {
      //   console.log("setting location");
      this._location = newLocation;
      this._data.location = new GeoPoint(newLocation.lat, newLocation.lng);
      this._data.tile_coordinates = this._generateTileCoordinates(
        this._location
      ); // update tile coords
    }

    public get isMiniSpot(): boolean {
      return this._data.isMiniSpot;
    }

    public get rating(): number | null {
      return this._data.rating;
    }
    public get numReviews(): number | null {
      return this._data.num_reviews;
    }
    public get ratingHistogram(): {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    } | null {
      return this._data.rating_histogram ?? null;
    }
    public get normalizedRatingHistogram(): {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    } | null {
      if (!this._data.rating_histogram) return null;

      // get the maximum number of reviews for a single rating
      let maxNumReviews = 0;
      for (let key in this._data.rating_histogram) {
        if (this._data.rating_histogram[key] > maxNumReviews) {
          maxNumReviews = this._data.rating_histogram[key];
        }
      }

      // divide every histogram value by the max
      let normalizedHistogram = {
        1: this._data.rating_histogram[1] / maxNumReviews,
        2: this._data.rating_histogram[2] / maxNumReviews,
        3: this._data.rating_histogram[3] / maxNumReviews,
        4: this._data.rating_histogram[4] / maxNumReviews,
        5: this._data.rating_histogram[5] / maxNumReviews,
      };

      return normalizedHistogram;
    }

    public get isIconic(): boolean {
      return this._data.is_iconic ?? false;
    }

    public getDescription(locale: string): string {
      if (this._data.description) {
        return this._data.description[locale] ?? "";
      }
      return "";
    }
    public setDescription(newDescription: string, locale: string) {
      if (!this._data.description) {
        this._data.description = {};
      }
      this._data.description[locale] = newDescription;
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

    get editableMedia(): ContributedMedia[] {
      return this._data.media ?? [];
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

    public getLocalityString(): string {
      let str = "";
      if (this._data.address?.sublocality) {
        str += this._data.address.sublocality + ", ";
      }
      if (this._data.address?.locality) {
        str += this._data.address.locality + ", ";
      }
      if (this._data.address?.country) {
        str += this._data.address.country.code.toUpperCase();
      }
      return str;
    }
    public get address(): AddressSchema {
      return this._data.address;
    }
    public set address(address: AddressSchema) {
      this._data.address = address;
    }

    public get formattedAddress(): string {
      return this._data.address.formatted ?? "";
    }

    public get tileCoordinates() {
      return this._data.tile_coordinates;
    }

    public get amenitiesArray(): { name: string; icon: string }[] {
      if (!this._data.amenities) return [];

      return AmenitiesOrder.map((key) => {
        if (!this._data.amenities[key]) return null;
        return { name: AmenityNames[key], icon: AmenityIcons[key] };
      }).filter((val) => val !== null);
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
        );
      }

      this._paths = this._makePathsFromBounds(this._data.bounds);

      this._location = {
        lat: this._data.location.latitude,
        lng: this._data.location.longitude,
      };
      this._data.tile_coordinates = this._generateTileCoordinates(
        this._location
      );

      if (!this._data.amenities) this._data.amenities = {};
      if (!this._data.amenities.indoor) this._data.amenities.indoor = false;
      if (!this._data.amenities.outdoor) this._data.amenities.outdoor = false;

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
      _dbService: SpotsService,
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
      _dbService: SpotsService,
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
              _storageService.deleteSpotImageFromStorage(storageFilename).then(
                () => {
                  // deleting successful
                  console.log("successfully deleted file: " + storageFilename);
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

    private _updateMedia(_dbService: SpotsService) {
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
      bounds: GeoPoint[]
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
    sublocality?: string;
    locality?: string;
    country?: {
      code: string; // alpha 2
      name: string;
    };
    formatted?: string;
  }

  export interface Schema {
    name: LocaleMap;

    location: GeoPoint;

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
    is_iconic?: boolean;
    description?: LocaleMap;
    media?: ContributedMedia[];

    type?: string;
    area?: string;

    rating?: number; // from 1 to 5, set by cloud function.
    num_reviews?: number; // integer
    rating_histogram?: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    }; //
    highlighted_reviews?: SpotReview[]; // max 3 reviews

    address?: AddressSchema;

    amenities?: AmenitiesMap;

    bounds?: GeoPoint[];

    time_created?: firebase.default.firestore.Timestamp;
    time_updated?: { seconds: number; nanoseconds: number };
  }

  export enum Types {
    Playground = `playground`,
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
