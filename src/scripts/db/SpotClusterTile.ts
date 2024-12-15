import { GeoPoint } from "firebase/firestore";
import { SpotPreviewData } from "./Spot";

export interface SpotClusterDot {
  location: GeoPoint; // on DB
  weight: number;
  spot_id?: string;
}

export interface SpotClusterTile {
  // the zoom level the tile should be loaded and displayed at.
  zoom: number;
  x: number;
  y: number;

  // the array of cluster points with their corresponding weights.
  dots: SpotClusterDot[];

  spots: SpotPreviewData[];
}

export type ClusterTileKey = string & { __brand: "ClusterTileKey" };

export function getClusterTileKey(
  zoom: number,
  x: number,
  y: number
): ClusterTileKey {
  return `z${zoom}_${x}_${y}` as ClusterTileKey;
}

export function getDataFromClusterTileKey(key: ClusterTileKey): {
  zoom: number;
  x: number;
  y: number;
} {
  const [z, x, y] = key.slice(1).split("_");
  return { zoom: parseInt(z), x: parseInt(x), y: parseInt(y) };
}
