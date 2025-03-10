type MVCArray<T> = google.maps.MVCArray<T>;
type LatLng = google.maps.LatLng;

export interface PolygonSchema {
  paths: MVCArray<MVCArray<LatLng>>;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
}
