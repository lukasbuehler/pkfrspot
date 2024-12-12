export interface DbLocation {
  _lat: number;
  _long: number;
}

export interface DbDate {
  seconds: number;
  nanoseconds: number;
}

export type SupportedLanguage =
  | "en"
  | "en-US"
  | "en-GB"
  | "de"
  | "de-CH"
  | "de-DE";
// TODO Fix this

// LangMap maps keys of SUPPORTED_LANGUAGES to strings
type LangMap = {
  [key in SupportedLanguage]?: string;
};

export interface LocaleMap extends LangMap {
  google_translate?: LangMap;
}

export enum MediaType {
  Video = "video",
  Image = "image",
  YouTube = "youtube",
  //Instagram = "instagram",
  Vimeo = "vimeo",
}

export interface Media {
  src: string;
  type: MediaType;
}

export interface ContributedMedia extends Media {
  uid: string;
  origin?: "streetview" | "user";
}

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
  "entry_fee",
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
];

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
