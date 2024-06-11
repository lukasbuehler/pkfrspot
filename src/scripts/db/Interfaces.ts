export interface DbLocation {
  _lat: number;
  _long: number;
}

export interface DbDate {
  seconds: number;
  nanoseconds: number;
}

interface LangMap {
  // english
  en_US?: string;
  en_GB?: string;

  // german
  de_DE?: string;
  de_CH?: string;
  de_AT?: string;

  // french
  fr_FR?: string;
  fr_CH?: string;
  fr_CA?: string;

  // italian
  it_IT?: string;
  it_CH?: string;
}

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
  sizes?: {
    full: string;
    "400x400": string;
    "200x200": string;
  };
  origin?: "streetview" | "user";
}
