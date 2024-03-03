import { Spot } from "./db/Spot.js";
import { SpotClusterTile } from "./db/SpotClusterTile.js";
import { GeoPoint } from "firebase/firestore";

export module MapHelpers {
  const TILE_SIZE = 256;

  export function mercatorProjection(
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

    var worldCoordinate = mercatorProjection(latLng);

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

  export function getClusterTilesForAllSpots(
    allSpots: Spot.Class[]
  ): Map<string, SpotClusterTile> {
    const clusterTiles = new Map<string, SpotClusterTile>();

    const clusterTilesMap = {
      12: new Map<string, string[]>(),
      10: new Map<string, string[]>(),
      8: new Map<string, string[]>(),
      6: new Map<string, string[]>(),
      4: new Map<string, string[]>(),
      2: new Map<string, string[]>(),
    };

    allSpots.forEach((spot) => {
      // for each spot, add a point of weight 1 to a cluster tile of zoom 14

      // get the tile coordinates for the spot at zoom 14
      const tile = spot.tileCoordinates.z14;

      // check if the tile exists in the clusterTilesMap for zoom 14
      if (clusterTiles.has(`z14_${tile.x}_${tile.y}`)) {
        // if the tile exists, add the spot to the array of spots in the cluster tile
        clusterTiles.get(`z14_${tile.x}_${tile.y}`).points.push({
          location: new GeoPoint(spot.location.lat, spot.location.lng),
          weight: 1,
        });
      } else {
        // if the tile does not exist, create a new array with the spot and add it to the clusterTilesMap for zoom 14
        clusterTiles.set(`z14_${tile.x}_${tile.y}`, {
          zoom: 14,
          x: tile.x,
          y: tile.y,
          points: [
            {
              location: new GeoPoint(spot.location.lat, spot.location.lng),
              weight: 1,
            },
          ],
        });

        // also add the 14 tile to the cluster tiles map for zoom 12
        const key12 = `z12_${tile.x >> 2}_${tile.y >> 2}`;
        console.log(key12);
        if (!clusterTilesMap[12].has(key12)) {
          clusterTilesMap[12].set(key12, [`z14_${tile.x}_${tile.y}`]);
        } else {
          clusterTilesMap[12].get(key12).push(`z14_${tile.x}_${tile.y}`);
        }
      }
    });

    for (let zoom = 12; zoom >= 2; zoom -= 2) {
      // fpr each z cluster tile to compute in the map
      for (let [tileKey, smallerTileKeys] of clusterTilesMap[zoom].entries()) {
        clusterTiles[tileKey] = {
          zoom: zoom,
          x: clusterTiles[smallerTileKeys[0]].x >> 2,
          y: clusterTiles[smallerTileKeys[0]].y >> 2,
          points: smallerTileKeys.map((key) => {
            let totalWeight = 0;
            let totalLat = 0;
            let totalLng = 0;

            for (let point of (clusterTiles[key] as SpotClusterTile).points) {
              totalWeight += point.weight;
              totalLat += point.location.latitude * point.weight;
              totalLng += point.location.longitude * point.weight;
            }

            return {
              location: new GeoPoint(
                totalLat / totalWeight,
                totalLng / totalWeight
              ),
              weight: totalWeight,
            };
          }),
        };

        // also add the zoom tile to the cluster tiles map for the next zoom level
        const key = `z${zoom - 2}_${clusterTiles[tileKey].x >> 2}_${
          clusterTiles[tileKey].y >> 2
        }`;
        if (!clusterTilesMap[zoom - 2].has(key)) {
          clusterTilesMap[zoom - 2].set(key, [tileKey]);
        } else {
          clusterTilesMap[zoom - 2].get(key).push(tileKey);
        }
      }
    }

    console.log(clusterTilesMap);

    return clusterTiles;
  }
}
