import { languageCodes } from "../../scripts/Languages";

export type LocaleCode = keyof typeof languageCodes;

export interface LocaleMap {
  user_provided?: { [langCode in LocaleCode]?: string };
  translated?: {
    [langCode in LocaleCode]?: {
      text: string;
      service: string;
      timestamp: Date;
      lang_from: string;
    };
  };
}

export type SpotSlug = {
  spotId: string;
};

export enum MediaType {
  Video = "video",
  Image = "image",
  YouTube = "youtube",
  //Instagram = "instagram",
  Vimeo = "vimeo",
}

/**
 * SizedStorageSrc is a string that represents a URL to a file in Firebase Storage.
 * It has a brand to distinguish it from other strings.
 *
 * To convert it to a string, call StorageService.getSrc(sizedStorageSrc).
 */
export type SizedStorageSrc = string & { __brand: "SizedStorageSrc" };

export interface OtherMedia {
  type: MediaType;
  src: string;
  origin?: "user" | "streetview" | "other";
}

export interface SizedUserMedia extends OtherMedia {
  uid: string;
  src: SizedStorageSrc;
  isSized?: boolean;
}

export type Media = OtherMedia | SizedUserMedia;

export function mediaIsUserMedia(media: Media): media is SizedUserMedia {
  return (media as SizedUserMedia).uid !== undefined;
}

// export interface StreetViewMedia {

// }

export interface AmenitiesMap {
  entry_fee?: boolean;
  indoor?: boolean;
  outdoor?: boolean;
  covered?: boolean;
  lighting?: boolean;
  wc?: boolean;
  changing_room?: boolean;
  lockers?: boolean;
  drinking_water?: boolean;
  parking_on_site?: boolean;
  power_outlets?: boolean;
  maybe_overgrown?: boolean;
}

export const AmenitiesOrder = [
  "indoor",
  "outdoor",
  "covered",
  "lighting",
  "wc",
  "changing_room",
  "lockers",
  "drinking_water",
  "parking_on_site",
  "power_outlets",
  "maybe_overgrown",
] as (keyof AmenitiesMap)[];

export const IndoorAmenities = [
  "changing_room",
  "lockers",
  "power_outlets",
] as (keyof AmenitiesMap)[];

export const GeneralAmenities = [
  "entry_fee",
  "wc",
  "drinking_water",
  "parking_on_site",
] as (keyof AmenitiesMap)[];

export const OutdoorAmenities = ["covered", "lighting", "maybe_overgrown"] as (
  | keyof AmenitiesMap
)[];

export const AmenityNames: { [key in keyof AmenitiesMap]: string } = {
  covered: $localize`:@@amenities.covered:Covered`,
  outdoor: $localize`:@@amenities.outdoor:Outdoor`,
  indoor: $localize`:@@amenities.indoor:Indoor`,
  lighting: $localize`:@@amenities.lighting:Lighting`,
  wc: $localize`:@@amenities.wc:WC`,
  changing_room: $localize`:@@amenities.changing_room:Changing room`,
  lockers: $localize`:@@amenities.lockers:Lockers`,
  entry_fee: $localize`:@@amenities.entry_fee:Entry fee`,
  drinking_water: $localize`:@@amenities.drinking_water:Drinking water`,
  parking_on_site: $localize`:@@amenities.parking_on_site:Parking on site`,
  power_outlets: $localize`:@@amenities.power_outlets:Power outlets`,
  maybe_overgrown: $localize`:@@amenities.maybe_overgrown:Maybe overgrown`,
};

export const AmenityIcons: { [key in keyof AmenitiesMap]: string } = {
  covered: "roofing",
  outdoor: "nature_people",
  indoor: "home",
  lighting: "lightbulb",
  wc: "wc",
  changing_room: "checkroom",
  lockers: "lock",
  entry_fee: "paid",
  drinking_water: "water_drop",
  parking_on_site: "local_parking",
  power_outlets: "power",
  maybe_overgrown: "grass",
};
