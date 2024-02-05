import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { map_style } from "./map_style";
import { Spot } from "src/scripts/db/Spot";
import { GoogleMap, MapPolygon } from "@angular/google-maps";
import { BehaviorSubject, Observable, take } from "rxjs";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
})
export class MapComponent implements AfterViewInit {
  @ViewChild("googleMap") googleMap: GoogleMap;
  @ViewChildren(MapPolygon) polygons: QueryList<MapPolygon>;
  @ViewChildren(MapPolygon, { read: ElementRef })
  polygonElements: QueryList<ElementRef>;

  private _center: google.maps.LatLngLiteral;
  @Input() set center(coords: google.maps.LatLngLiteral) {
    this._center = coords;
    if (this.googleMap) {
      this.googleMap.panTo(this._center);
    }
  }
  @Output() centerChange = new EventEmitter<google.maps.LatLngLiteral>();
  get center() {
    return this._center;
  }

  _zoom: number = 4;
  @Input() set zoom(newZoom: number) {
    this._zoom = newZoom;
    if (this.googleMap) {
      this.googleMap.zoom = newZoom;
    }
  }
  @Output() zoomChange = new EventEmitter<number>();
  get zoom() {
    return this._zoom;
  }
  setZoom(newZoom: number) {
    this._zoom = newZoom;
    if (this.googleMap) {
      this.googleMap.zoom = newZoom;
    }
    this.zoomChange.emit(this._zoom);
  }

  getAndEmitChangedZoom() {
    this._zoom = this.googleMap.getZoom();
    this.zoomChange.emit(this._zoom);
  }

  @Output() boundsChange = new EventEmitter<google.maps.LatLngBounds>();
  @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
  @Output() spotClick = new EventEmitter<Spot.Class>();
  @Output() polygonChanged = new EventEmitter<{
    spotId: string;
    path: google.maps.LatLngLiteral[][];
  }>();

  @Input() spots: Spot.Class[] = [];
  @Input() dots: any[] = [];
  @Input() selectedSpot: Spot.Class | null = null;
  @Input() isEditing: boolean = false;

  ngAfterViewInit(): void {
    let geolocationWatchId = navigator.geolocation.watchPosition(
      (_location) => {
        let locObj = {
          location: {
            lat: _location.coords.latitude,
            lng: _location.coords.longitude,
          },
          accuracy: _location.coords.accuracy,
        };
        this.geolocation$.next(locObj);
      },
      (error) => {
        console.error(error);
        navigator.geolocation.clearWatch(geolocationWatchId);
        this.geolocation$.complete();
      },
      {
        enableHighAccuracy: true,
      }
    );
  }

  geolocation$: BehaviorSubject<{
    location: google.maps.LatLngLiteral;
    accuracy: number;
  } | null> = new BehaviorSubject<{
    location: google.maps.LatLngLiteral;
    accuracy: number;
  }>(null);

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
    opacity: 1,
  };
  selectedSpotMarkerEditingOptions: google.maps.MarkerOptions = {
    draggable: true,
    clickable: false,
    crossOnDrag: true,
    icon: {
      url: "/assets/icons/marker.png",
    },
    opacity: 1,
  };
  noSelectedSpotMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    clickable: false,
    icon: {
      url: "/assets/icons/marker.png",
    },
    opacity: 0,
  };
  geolocationMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    clickable: false,
    opacity: 1,
    icon: {
      url: "/assets/icons/geolocation-16x16.png",
      anchor: new google.maps.Point(8, 8),
    },
    zIndex: 1000,
  };
  dotMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    clickable: false,
    opacity: 0.5,
    icon: {
      url: "/assets/icons/circle-16x16.png",
      anchor: new google.maps.Point(8, 8),
    },
  };
  spotCircleOptions: google.maps.CircleOptions = {
    fillColor: "#b8c4ff",
    fillOpacity: 0.3,
    strokeColor: "#b8c4ff",
    draggable: false,
    clickable: true,
    strokeWeight: 1,
  };
  geolocationCircleOptions: google.maps.CircleOptions = {
    fillColor: "#0000ff",
    fillOpacity: 0.2,
    draggable: false,
    clickable: false,
    strokeWeight: 0,
  };
  spotPolygonOptions: google.maps.PolygonOptions = {
    fillColor: "#b8c4ff",
    strokeColor: "#b8c4ff",
    fillOpacity: 0.2,
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
    this.boundsChange.emit(bounds);
  }

  emitCenterChanged() {
    const center = this.googleMap.getCenter();
    this.centerChange.emit(center.toJSON());
  }

  editingSpotPositionChanged(position: google.maps.LatLng) {
    this.selectedSpot.location = position.toJSON();
  }

  focusOnGeolocation() {
    let geolocation = this.geolocation$.value;
    if (geolocation) {
      this.googleMap.panTo(geolocation.location);
      this.setZoom(17);
    } else {
      // TODO maybe ask again for geolocation in the future
    }
  }

  private _getPolygonBySpotId(spotId: string): MapPolygon | undefined {
    console.log(this.polygonElements.toArray());
    console.log(this.polygons.toArray());

    const elementRef = this.polygonElements.find(
      (element) => element.nativeElement.id === "polygon-" + spotId
    );
    if (elementRef) {
      const index = this.polygonElements.toArray().indexOf(elementRef);
      return this.polygons.toArray()[index];
    }
    return undefined;
  }

  public getPolygonPathForSpot(
    spotId: string
  ): google.maps.LatLngLiteral[][] | undefined {
    let polygon = this._getPolygonBySpotId(spotId);

    if (polygon) {
      const newPaths: google.maps.MVCArray<
        google.maps.MVCArray<google.maps.LatLng>
      > = polygon.getPaths();
      console.log("new paths", newPaths);

      // Convert LatLng[][] to LatLngLiteral[][]
      let literalNewPaths: Array<Array<google.maps.LatLngLiteral>> = [];
      literalNewPaths[0] = newPaths
        .getAt(0)
        .getArray()
        .map((v, i, arr) => {
          return { lat: v.lat(), lng: v.lng() };
        });

      return literalNewPaths;
    } else {
      console.error("No polygon found for spot with id: " + spotId);
      return;
    }
  }
}
