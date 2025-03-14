import { AmenitiesMap } from "../schemas/Amenities";

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
