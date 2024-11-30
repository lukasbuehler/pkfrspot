import { GeoPoint } from "firebase/firestore";

export interface SpotClusterTile {
  // the zoom level the tile should be loaded and displayed at.
  zoom: number;
  x: number;
  y: number;

  // the array of cluster points with their corresponding weights.
  dots: {
    location: GeoPoint;
    weight: number;
  }[];
}
