export interface SpotClusterTile {
  zoom: number;
  x: number;
  y: number;
  points: {
    location: {
      lat: number;
      lng: number;
    };
    weight: number;
  }[];
}
