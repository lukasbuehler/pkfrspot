export module MapHelper {
  const TILE_SIZE = 256;

  export function mercator_projection(
    latLng: google.maps.LatLngLiteral
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

  export function getTileCoordinatesForLocationAndZoom(
    latLng: google.maps.LatLngLiteral,
    zoom: number
  ): google.maps.Point {
    var scale = 1 << zoom; // 2^zoom

    var worldCoordinate = mercator_projection(latLng);

    return new google.maps.Point(
      Math.floor((worldCoordinate.x * scale) / TILE_SIZE),
      Math.floor((worldCoordinate.y * scale) / TILE_SIZE)
    );
  }

  export function getDisplayCoordinates(
    coordinates: google.maps.LatLngLiteral
  ) {
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
}
