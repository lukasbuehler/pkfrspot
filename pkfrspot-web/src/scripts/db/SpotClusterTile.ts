export interface SpotClusterTile {
  // the zoom level the tile should be loaded and displayed at.
  zoom: number;

  sizeZoom: number; // usually: zoom - 2
  x: number;
  y: number;

  // the array of cluster points with their corresponding weights.
  points: {
    location: {
      lat: number;
      lng: number;
    };
    weight: number;
  }[];
}
