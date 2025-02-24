import { GeoPoint } from "@firebase/firestore";
import {
  LocaleMap,
  ContributedMedia,
  AmenitiesMap,
} from "../models/Interfaces";
import { SpotReviewSchema } from "./SpotReviewSchema";

export interface SpotAddressSchema {
  sublocality?: string;
  locality?: string;
  country?: {
    code: string; // alpha 2
    name: string;
  };
  formatted?: string;
}

export interface SpotSchema {
  name: LocaleMap;

  location: GeoPoint;

  tile_coordinates?: {
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
  description?: LocaleMap;
  media?: ContributedMedia[];

  is_iconic?: boolean;
  rating?: number; // from 1 to 5, set by cloud function.
  num_reviews?: number; // integer
  rating_histogram?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  highlighted_reviews?: SpotReviewSchema[]; // max 3 reviews

  address?: SpotAddressSchema;

  external_references?: {
    google_maps_place_id?: string;
    website_url?: string;
  };

  type?: string;
  area?: string;
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
