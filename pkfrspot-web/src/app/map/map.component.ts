import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { map_style } from "./map_style";
import { Spot } from "src/scripts/db/Spot";
import { GoogleMap } from "@angular/google-maps";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
})
export class MapComponent {
  @ViewChild("googleMap") googleMap: GoogleMap;

  // The default coordinates are Paris, the origin of parkour.
  // modiying this resets the map
  readonly start_coordinates: google.maps.LatLngLiteral = {
    lat: 48.8517386,
    lng: 2.298386,
  };

  private _center: google.maps.LatLngLiteral = this.start_coordinates;
  @Input() set center(coords: google.maps.LatLngLiteral) {
    this._center = coords;
    if (this.googleMap) {
      this.googleMap.panTo(this._center);
    }
  }
  @Output() centerChanged = new EventEmitter<google.maps.LatLngLiteral>();

  _zoom: number = 4;
  @Input() set zoom(newZoom: number) {
    this._zoom = newZoom;
    if (this.googleMap) {
      this.googleMap.zoom = newZoom;
    }
  }
  @Output() zoomChanged = new EventEmitter<number>();
  get zoom() {
    return this._zoom;
  }
  setZoom(newZoom: number) {
    this._zoom = newZoom;
    if (this.googleMap) {
      this.googleMap.zoom = newZoom;
    }
    this.zoomChanged.emit(this._zoom);
  }

  getAndEmitChangedZoom() {
    this._zoom = this.googleMap.getZoom();
    this.zoomChanged.emit(this._zoom);
  }

  @Output() boundsChanged = new EventEmitter<google.maps.LatLngBounds>();
  @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
  @Output() spotClick = new EventEmitter<Spot.Class>();

  @Input() spots: Spot.Class[] = [];
  @Input() dots: any[] = [];
  @Input() selectedSpot: Spot.Class | null = null;

  //spotDotZoomRadii: number[] = Array<number>(16);

  //mapStyle: google.maps.MapTypeId = google.maps.MapTypeId.ROADMAP;
  mapStyle = "roadmap";
  mapStylesConfig = map_style;

  mapOptions: google.maps.MapOptions = {
    backgroundColor: "#000000",
    clickableIcons: false,
    gestureHandling: "greedy",
    mapTypeId: this.mapStyle,
    disableDefaultUI: true,
    styles: this.mapStylesConfig,
  };
  mapTypeId: string = "roadmap";
  selectedSpotMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    clickable: false,
    icon: {
      url: "/assets/icons/marker.png",
    },
  };
  selectedSpotMarkerEditingOptions: google.maps.MarkerOptions = {
    draggable: true,
    clickable: false,
    crossOnDrag: true,
    icon: {
      url: "/assets/icons/marker.png",
    },
  };
  dotCircleOptions: google.maps.CircleOptions = {
    fillColor: "#b8c4ff",
    fillOpacity: 0.5,
    strokeColor: "#b8c4ff",
    draggable: false,
    clickable: false,
    strokeWeight: 10,
    strokeOpacity: 0.5,
  };
  spotCircleOptions: google.maps.CircleOptions = {
    fillColor: "#b8c4ff",
    fillOpacity: 0.75,
    strokeColor: "#b8c4ff",
    draggable: false,
    clickable: true,
    strokeWeight: 1,
  };
  spotPolygonOptions: google.maps.PolygonOptions = {
    fillColor: "#b8c4ff",
    strokeColor: "#b8c4ff",
    fillOpacity: 0.1,
    editable: false,
    draggable: false,
    clickable: true,
  };
  spotPolygonEditingOptions: google.maps.PolygonOptions = {
    fillColor: "#b8c4ff",
    strokeColor: "#b8c4ff",
    fillOpacity: 0.1,
    editable: true,
    draggable: false,
    clickable: true,
  };

  toggleMapStyle() {
    if (
      this.mapTypeId.toLowerCase() ===
      google.maps.MapTypeId.ROADMAP.toLowerCase()
    ) {
      // if it is equal to roadmap, toggle to satellite
      this.mapTypeId = google.maps.MapTypeId.SATELLITE;
    } else {
      // otherwise toggle back to roadmap
      this.mapTypeId = google.maps.MapTypeId.ROADMAP;
    }
  }

  emitBoundsChanged() {
    const bounds = this.googleMap.getBounds();
    this.boundsChanged.emit(bounds);
  }
}
