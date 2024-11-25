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
  covered: boolean;
  outdoor: boolean;
  indoor: boolean;
  lighting: boolean;
  wc: boolean;
  changing_room: boolean;
  lockers: boolean;
  entry_fee: boolean;
  drinking_water: boolean;
  parking_on_site: boolean;
  power_outlets: boolean;
  maybe_overgrown: boolean;
}
