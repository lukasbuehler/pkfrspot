import { LatLngLiteral } from "@agm/core";

export module MapHelper {
  const TILE_SIZE = 256;

  export function mercator_projection(
    latLng: LatLngLiteral
  ): google.maps.Point {
    var siny = Math.sin((latLng.lat * Math.PI) / 180);

    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);

    return new google.maps.Point(
      TILE_SIZE * (0.5 + latLng.lng / 360),
      TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
    );
  }

  export function getTileCoordinates(
    latLng: LatLngLiteral,
    zoom: number
  ): google.maps.Point {
    var scale = 1 << zoom; // 2^zoom

    var worldCoordinate = mercator_projection(latLng);

    return new google.maps.Point(
      Math.floor((worldCoordinate.x * scale) / TILE_SIZE),
      Math.floor((worldCoordinate.y * scale) / TILE_SIZE)
    );
  }
}
