import { GeoPoint } from "firebase/firestore";
import { SpotClusterTile } from "./db/SpotClusterTile";

export interface PartialSpotSchema {
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
}

export module ClusterHelpers {
  function _clusterPoints(
    zoom: number,
    arrayOfPoints: { location: GeoPoint; weight: number }[][]
  ): { location: GeoPoint; weight: number }[] {
    // flatten the array of points
    return arrayOfPoints.flat();

    // TODO actually cluster maybe?
  }

  export function getClusterTilesForAllSpots(
    allSpots: PartialSpotSchema[]
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

    console.log("debug: starting clustrering");

    allSpots.forEach((spot) => {
      // for each spot, add a point of weight 1 to a cluster tile of zoom 14

      // get the tile coordinates for the spot at zoom 14
      const tile = spot.tile_coordinates.z12; // the coords are for tiles at zoom 12

      const clusterTilePoint = {
        location: spot.location,
        weight: 1,
      };

      // check if the tile exists in the clusterTilesMap for zoom 14
      if (clusterTiles.has(`z14_${tile.x}_${tile.y}`)) {
        // if the tile exists, add the spot to the array of spots in the cluster tile
        clusterTiles
          .get(`z14_${tile.x}_${tile.y}`)!
          .points.push(clusterTilePoint);
      } else {
        // if the tile does not exist, create a new array with the spot and add it to the clusterTilesMap for zoom 14
        clusterTiles.set(`z14_${tile.x}_${tile.y}`, {
          zoom: 14,
          x: tile.x,
          y: tile.y,
          points: [clusterTilePoint],
        });

        // also add the 14 tile to the cluster tiles map for zoom 12
        const key12 = `z12_${tile.x >> 2}_${tile.y >> 2}`;
        console.log(key12);
        if (!clusterTilesMap[12].has(key12)) {
          clusterTilesMap[12].set(key12, [`z14_${tile.x}_${tile.y}`]);
        } else {
          clusterTilesMap[12].get(key12)!.push(`z14_${tile.x}_${tile.y}`);
        }
      }
    });

    for (let zoom = 12; zoom >= 2; zoom -= 2) {
      // for each z cluster tile to compute in the map
      for (let [tileKey, smallerTileKeys] of clusterTilesMap[
        zoom as 12 | 10 | 8 | 6 | 4 | 2
      ].entries()) {
        const firstSmallerTile = clusterTiles.get(smallerTileKeys[0])!;

        clusterTiles.set(tileKey, {
          zoom: zoom,
          x: firstSmallerTile.x >> 2,
          y: firstSmallerTile.y >> 2,
          points: _clusterPoints(
            zoom,
            smallerTileKeys.map((key) => {
              return (clusterTiles.get(key) as SpotClusterTile).points;
            })
          ),
        });

        // also add the zoom tile to the cluster tiles map for the next zoom level
        if (zoom > 2) {
          const tile = clusterTiles.get(tileKey)!;
          const key = `z${zoom - 2}_${tile.x >> 2}_${tile.y >> 2}`;
          if (
            !clusterTilesMap[(zoom - 2) as 12 | 10 | 8 | 6 | 4 | 2].has(key)
          ) {
            clusterTilesMap[(zoom - 2) as 12 | 10 | 8 | 6 | 4 | 2].set(key, [
              tileKey,
            ]);
          } else {
            clusterTilesMap[(zoom - 2) as 12 | 10 | 8 | 6 | 4 | 2]
              .get(key)!
              .push(tileKey);
          }
        }
      }
    }

    return clusterTiles;
  }
}
