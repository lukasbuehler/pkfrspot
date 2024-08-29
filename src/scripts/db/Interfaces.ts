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
  | "en_US"
  | "en_GB"
  | "de"
  | "de_CH"
  | "de_DE";

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
