import { SpotSchema } from "../db/schemas/SpotSchema";

export namespace MapHelpers {
  const TILE_SIZE = 256;

  export function mercatorProjection(latLng: google.maps.LatLngLiteral): {
    x: number;
    y: number;
  } {
    var siny = Math.sin((latLng.lat * Math.PI) / 180);

    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);

    return {
      x: TILE_SIZE * (0.5 + latLng.lng / 360),
      y: TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)),
    };
  }

  export function getTileCoordinatesForLocationAndZoom(
    latLng: google.maps.LatLngLiteral,
    zoom: number
  ): { x: number; y: number } {
    var scale = 1 << zoom; // 2^zoom

    var worldCoordinate = mercatorProjection(latLng);

    return {
      x: Math.floor((worldCoordinate.x * scale) / TILE_SIZE),
      y: Math.floor((worldCoordinate.y * scale) / TILE_SIZE),
    };
  }

  export function getDisplayCoordinates(
    coordinates: google.maps.LatLngLiteral
  ): string {
    let lat: number = coordinates.lat;
    let lng: number = coordinates.lng;

    let isNorth: boolean = lat >= 0;
    let isEast: boolean = lng >= 0;
    lat = Math.abs(lat);
    lng = Math.abs(lng);

    let latDegrees = Math.floor(lat);
    let lngDegrees = Math.floor(lng);

    lat = (lat - latDegrees) * 60;
    lng = (lng - lngDegrees) * 60;
    let latMinutes = Math.floor(lat);
    let lngMinutes = Math.floor(lng);

    lat = (lat - latMinutes) * 60;
    lng = (lng - lngMinutes) * 60;
    let latSeconds = Math.round(lat * 1000) / 1000;
    let lngSeconds = Math.round(lng * 1000) / 1000;

    return `${latDegrees}° ${latMinutes}' ${latSeconds}'' ${
      isNorth ? "N" : "S"
    }, ${lngDegrees}° ${lngMinutes}' ${lngSeconds}'' ${isEast ? "E" : "W"}`;
  }

  export function getTileCoordinates(
    location: google.maps.LatLngLiteral
  ): SpotSchema["tile_coordinates"] {
    let tile_coordinates: Partial<SpotSchema["tile_coordinates"]> = {
      z16: MapHelpers.getTileCoordinatesForLocationAndZoom(location, 16),
    };

    for (let zoom = 16; zoom >= 2; zoom -= 2) {
      tile_coordinates[`z${zoom}` as keyof SpotSchema["tile_coordinates"]] = {
        x: tile_coordinates.z16.x >> (16 - zoom),
        y: tile_coordinates.z16.y >> (16 - zoom),
      };
    }

    return tile_coordinates as SpotSchema["tile_coordinates"];
  }
}
