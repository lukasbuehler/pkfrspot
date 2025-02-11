import {
  ContributedMedia,
  LocaleMap,
  MediaType,
  AmenitiesMap,
  AmenityNames,
  AmenityIcons,
  AmenitiesOrder,
  LocaleCode,
} from "./Interfaces";
import { MapHelpers } from "../../scripts/MapHelpers";
import { environment } from "../../environments/environment";
import { GeoPoint } from "firebase/firestore";
import { SpotAddressSchema, SpotSchema } from "../schemas/SpotSchema";
import {
  computed,
  effect,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { defaultSpotNames } from "../../../functions/src/spotHelpers";
import { SpotReviewSchema } from "../schemas/SpotReviewSchema";

export interface SpotPreviewData {
  name: string;
  id: string;
  locality: string;
  imageSrc: string;
  isIconic: boolean;
  rating?: number; // whole number 1-10
}

export type SpotId = string & { __brand: "SpotId" };
export type SpotSlug = string & { __brand: "SpotSlug" };

export class LocalSpot {
  names: WritableSignal<LocaleMap>;
  name: Signal<string>;

  location: WritableSignal<google.maps.LatLngLiteral>;
  locationString: Signal<string>;

  readonly tileCoordinates: SpotSchema["tile_coordinates"];
  descriptions?: WritableSignal<LocaleMap>;
  description?: Signal<string>;

  // Media stuff
  userMedia: WritableSignal<ContributedMedia[]>;
  private _streetview?: Signal<ContributedMedia>; // signal that is computed from location
  readonly media: Signal<ContributedMedia[]>;
  readonly hasMedia: Signal<boolean>;
  readonly previewImageSrc: Signal<string>;

  isIconic: boolean;
  rating?: number; // from 1 to 5, set by cloud function.
  numReviews?: number; // integer
  ratingHistogram?: WritableSignal<{
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  }>;
  normalizedRatingHistogram?: Signal<{
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  }>;
  readonly highlightedReviews?: SpotReviewSchema[];

  address?: WritableSignal<SpotAddressSchema>;
  formattedAddress: Signal<string>;
  localityString: Signal<string>;

  type?: string;
  area?: string;
  amenities?: WritableSignal<AmenitiesMap>;
  amentitiesArray;

  paths?: google.maps.LatLngLiteral[][];

  constructor(data: SpotSchema, readonly locale: LocaleCode) {
    this.names = signal(data.name);
    this.name = computed(() => {
      if (this.names()[locale]) {
        return this.names()[locale];
      } else {
        // return the first name if the locale doesn't exist
        return this.names()[Object.keys(this.names())[0]];
      }
    });

    this.location = signal({
      lat: data.location.latitude,
      lng: data.location.longitude,
    });

    this.locationString = computed(() => {
      return MapHelpers.getDisplayCoordinates(this.location());
    });

    this.descriptions = signal(data.description);
    this.description = computed(() => {
      if (this.descriptions()[locale]) {
        return this.descriptions()[locale];
      } else {
        // return the first description if the locale doesn't exist
        return this.descriptions()[Object.keys(this.descriptions())[0]];
      }
    });

    this.userMedia = signal(data.media ?? []);
    // initilize media signal with streetview
    this._loadStreetviewForLocation(this.location()).then((streetview) => {
      this._streetview = signal(streetview);
    });

    // Update the media signal when the location, or user media changes
    effect(async () => {
      const location = this.location();
      const streetview = await this._loadStreetviewForLocation(location);
      const arr = [].concat(this.media(), streetview ?? []);
      this.userMedia.set(arr);
    });

    this.hasMedia = computed(() => {
      return this.media().length > 0;
    });

    this.previewImageSrc = computed(() => {
      const previewSize: string = "400x400";

      if (this.hasMedia()) {
        if (this.userMedia().length > 0) {
          let media = this.userMedia()[0];
          let url = media.src;
          if (media.uid) {
            // has uid: is from a user.
            url = url.replace(/\?/, `_${previewSize}?`);
          }

          return url;
        } else {
          return this.media()[0].src;
        }
      }
      return "";
    });

    this.isIconic = data.is_iconic ?? false;
    this.rating = data.rating;
    this.numReviews = data.num_reviews;
    this.ratingHistogram = signal(data.rating_histogram);

    this.normalizedRatingHistogram = computed(() => {
      const hist = this.ratingHistogram();
      if (!hist) return null;

      // get the maximum number of reviews for a single rating
      let maxNumReviews = 0;
      for (let key in hist) {
        if (hist[key] > maxNumReviews) {
          maxNumReviews = hist[key];
        }
      }

      // divide every histogram value by the max
      let normalizedHistogram = {
        1: hist[1] / maxNumReviews,
        2: hist[2] / maxNumReviews,
        3: hist[3] / maxNumReviews,
        4: hist[4] / maxNumReviews,
        5: hist[5] / maxNumReviews,
      };

      return normalizedHistogram;
    });

    this.highlightedReviews = data.highlighted_reviews;

    this.address = signal(data.address);
    this.formattedAddress = computed(() => this.address()?.formatted ?? "");
    this.localityString = computed(() => {
      const address = this.address();
      let str = "";
      if (address?.sublocality) {
        str += address.sublocality + ", ";
      }
      if (address?.locality) {
        str += address.locality + ", ";
      }
      if (address?.country) {
        str += address.country.code.toUpperCase();
      }
      return str;
    });

    this.type = data.type;
    this.area = data.area;

    // Set the default amenities if they don't exist
    if (!data.amenities) data.amenities = {};
    if (!data.amenities.indoor) data.amenities.indoor = false;
    if (!data.amenities.outdoor) data.amenities.outdoor = false;
    this.amenities = signal(data.amenities);
    this.amentitiesArray = computed(() => {
      const amenities = this.amenities();
      if (!amenities) return [];

      return AmenitiesOrder.map((key) => {
        if (!amenities[key]) return null;
        return { name: AmenityNames[key], icon: AmenityIcons[key] };
      }).filter((val) => val !== null);
    });

    this.paths = this._makePathsFromBounds(data.bounds);
  }

  /**
   * Returns the spot's data in the format of the SpotSchema interface.
   * @returns SpotSchema
   */
  public data(): SpotSchema {
    const location = this.location();

    const data: SpotSchema = {
      name: this.names(),
      location: new GeoPoint(location.lat, location.lng),
      tile_coordinates: MapHelpers.getTileCoordinates(location),
      description: this.descriptions(),
      media: this.userMedia(),
      is_iconic: this.isIconic,
      rating: this.rating,
      num_reviews: this.numReviews,
      rating_histogram: this.ratingHistogram(),
      highlighted_reviews: this.highlightedReviews,
      address: this.address(),
      type: this.type,
      area: this.area,
      amenities: this.amenities(),
      bounds: this._makeBoundsFromPaths(this.paths),
    };

    return data;
  }

  public setName(newName: string, locale: LocaleCode) {
    this.names.set({ [locale]: newName });
  }

  public setDescription(newDescription: string, locale: LocaleCode) {
    if (!this.description || !this.descriptions().user_provided) {
      this.descriptions.set({
        user_provided: {},
      });
    }
    this.descriptions().user_provided[locale] = newDescription;
  }

  public hasBounds() {
    return !!(this.paths?.length > 0);
  }

  public getMediaByIndex(index: number): ContributedMedia {
    return this.media()[index];
  }

  /// MEDIA

  // public addMedia(
  //   _dbService: SpotsService,
  //   src: string,
  //   type: MediaType,
  //   uid: string
  // ) {
  //   const _userMedia: ContributedMedia[] = this.userMedia();
  //   _userMedia.push({ src: src, type: type, uid: uid })
  //   this.userMedia.set(_userMedia);

  //   // this._updateMedia(_dbService);
  // }

  // public setMedia(
  //   media: ContributedMedia[],
  //   _dbService: SpotsService,
  //   _storageService: StorageService
  // ) {
  //   for (let mediaObj of this._data.media) {
  //     if (
  //       media.findIndex((val) => {
  //         return val.src === mediaObj.src;
  //       }) < 0 &&
  //       mediaObj.type === MediaType.Image
  //     ) {
  //       // this image was deleted
  //       let filenameRegex = RegExp(
  //         /(?:spot_pictures)(?:\/|%2F)(.+?)(?:\?.*)?$/
  //       );
  //       let storageFilenameMatch = mediaObj.src.match(filenameRegex);
  //       if (storageFilenameMatch[1]) {
  //         let storageFilename = storageFilenameMatch[1] || "";

  //         if (storageFilename) {
  //           _storageService.deleteSpotImageFromStorage(storageFilename).then(
  //             () => {
  //               // deleting successful
  //               console.log("successfully deleted file: " + storageFilename);
  //             },
  //             (error) => {
  //               console.error(error);
  //             }
  //           );
  //         } else {
  //           console.error(
  //             "Couldn't resolve storage filename when setting media"
  //           );
  //         }
  //       } else {
  //         console.error("Regex Match doesn't resolve a filename");
  //         console.log(storageFilenameMatch);
  //       }
  //     }
  //   }

  //   this._data.media = media;
  //   // this._updateMedia(_dbService);
  // }

  // private _updateMedia(_dbService: SpotsService) {
  //   _dbService.updateSpot(this._id, { media: this._data.media });
  // }

  /////////////////// END MEDIA

  public clone(): LocalSpot {
    const dataCopy: SpotSchema = JSON.parse(JSON.stringify(this.data()));
    return new LocalSpot(dataCopy, this.locale);
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

  // TODO move this to maps api service
  private async _loadStreetviewForLocation(
    location: google.maps.LatLngLiteral
  ): Promise<ContributedMedia> {
    // street view metadata
    return fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?size=800x800&location=${
        location.lat
      },${
        location.lng
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
              location.lat
            },${
              location.lng
            }&fov=${120}&return_error_code=${true}&source=outdoor&key=${
              environment.keys.firebaseConfig.apiKey
            }`,
            type: MediaType.Image,
            uid: "",
            origin: "streetview",
          };

          return streetView;
        }
      });
  }
}

export class Spot extends LocalSpot {
  readonly id: SpotId;

  constructor(private _id: SpotId, _data: SpotSchema, locale: LocaleCode) {
    super(_data, locale);
    this.id = _id;
  }

  public override clone(): Spot {
    const dataCopy = JSON.parse(JSON.stringify(this.data()));
    return new Spot(this.id, dataCopy, this.locale);
  }
}

/**
 * Converts the a local spot (without an id) to a spot with an id.
 * @param _id the id of the spot in the database
 * @returns A spot object
 */
export function convertLocalSpotToSpot(
  localSpot: LocalSpot,
  _id: SpotId
): Spot {
  let spotPlusId = localSpot as LocalSpot & { id: SpotId };
  spotPlusId.id = _id;
  return spotPlusId as Spot;
}
