import { GeoPoint } from "firebase/firestore";

export interface PartialSpotSchema {
  name: { [langCode: string]: string };
  address?: {
    country: {
      code: string;
      name: string;
    };
    formatted: string;
    locality: string;
    sublocality?: string;
  };
  media: {
    src: string;
    type: string;
    uid?: string;
  }[];
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
  isIconic?: boolean;
  rating?: number;
}

export const defaultSpotNames: { [code: string]: string } = {
  en: "Unnamed Spot",
  "en-US": "Unnamed Spot",
  "en-GB": "Unnamed Spot",
  de: "Unbenannter Spot",
  "de-DE": "Unbenannter Spot",
  "de-CH": "Unbenännte Spot",
};

export function getSpotName(
  spotSchema: PartialSpotSchema,
  locale: string
): string {
  if (spotSchema.name) {
    const nameLocales: string[] = Object.keys(spotSchema.name);
    if (nameLocales.length > 0) {
      if (nameLocales.includes(locale)) {
        return spotSchema.name[locale];
      } else if (nameLocales.includes(locale.split("-")[0])) {
        return spotSchema.name[locale.split("-")[0]];
      } else if (nameLocales.includes("en")) {
        return spotSchema.name["en"];
      } else {
        return spotSchema.name[nameLocales[0]];
      }
    }
  }
  return defaultSpotNames[locale];
}

export function getSpotPreviewImage(spotSchema: PartialSpotSchema): string {
  const previewSize: string = "400x400";

  if (spotSchema.media && spotSchema.media[0]?.type === "image") {
    const media = spotSchema.media[0];
    let url: string = media.src;
    if (media.uid) {
      // has uid: is from a user.
      url = url.replace(/\?/, `_${previewSize}?`);
    }

    return url;
  }
  return "";
}

export function getSpotLocalityString(spotSchema: PartialSpotSchema): string {
  let str = "";
  const { address } = spotSchema;

  if (address) {
    if (address.sublocality) {
      str += `${address.sublocality}, `;
    }
    if (address.locality) {
      str += `${address.locality}, `;
    }
    if (address.country) {
      str += address.country.code.toUpperCase();
    }
  }
  return str;
}
