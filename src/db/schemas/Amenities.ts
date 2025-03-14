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
