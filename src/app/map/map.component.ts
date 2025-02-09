import {
  OnInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { Spot, SpotPreviewData } from "../../db/models/Spot";
import {
  GoogleMap,
  MapPolygon,
  MapCircle,
  MapAdvancedMarker,
  //   MapHeatmapLayer,
} from "@angular/google-maps";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { MapsApiService } from "../services/maps-api.service";
import {
  SpotClusterDot,
  SpotClusterTile,
} from "../../db/models/SpotClusterTile.js";
import { GeoPoint } from "firebase/firestore";
import { NgIf, NgFor, AsyncPipe, NgClass } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { trigger, transition, style, animate } from "@angular/animations";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
  imports: [
    NgIf,
    GoogleMap,
    MapCircle,
    MapPolygon,
    MapAdvancedMarker,
    MatIconModule,
    NgFor,
    NgClass,
    AsyncPipe,
    // MapHeatmapLayer,
  ],
  animations: [
    trigger("fadeInOut", [
      transition(":enter", [
        style({ opacity: 0, scale: 0.8 }),
        animate("0.3s ease-out", style({ opacity: 1, scale: 1 })),
      ]),
      transition(":leave", [
        style({ opacity: 1, scale: 1 }),
        animate("0.3s ease-in", style({ opacity: 0, scale: 0.8 })),
      ]),
    ]),
  ],
})
export class MapComponent implements OnInit {
  @ViewChild("googleMap") googleMap: GoogleMap;
  @ViewChildren(MapPolygon) polygons: QueryList<MapPolygon>;
  @ViewChildren(MapPolygon, { read: ElementRef })
  polygonElements: QueryList<ElementRef>;
  @ViewChild("selectedSpotMarkerNode") selectedSpotMarkerNode: Node;

  // add math function to markup
  sqrt = Math.sqrt;

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
    return this._zoom ?? 4;
  }
  setZoom(newZoom: number) {
    this.zoom = newZoom;
    this.zoomChange.emit(this._zoom);
  }

  getAndEmitChangedZoom() {
    this._zoom = this.googleMap.getZoom();
    this.zoomChange.emit(this._zoom);
  }

  @Output() boundsChange = new EventEmitter<google.maps.LatLngBounds>();
  @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
  @Output() spotClick = new EventEmitter<Spot | SpotPreviewData | string>();
  @Output() polygonChanged = new EventEmitter<{
    spotId: string;
    path: google.maps.LatLngLiteral[][];
  }>();
  @Output() hasGeolocationChange = new EventEmitter<boolean>();

  @Input() spots: Spot[] = [];
  @Input() dots: SpotClusterDot[] = [];

  @Input() selectedSpot: Spot | null = null;
  @Input() isEditing: boolean = false;
  @Input() showGeolocation: boolean = false;
  @Input() markers: google.maps.LatLngLiteral[] = [];
  @Input() selectedMarker: google.maps.LatLngLiteral | null = null;

  @Input() boundRestriction: {
    north: number;
    south: number;
    west: number;
    east: number;
  } | null = null;
  @Input() minZoom: number = 4;

  @Input() mapTypeId:
    | google.maps.MapTypeId.SATELLITE
    | google.maps.MapTypeId.ROADMAP =
    "roadmap" as google.maps.MapTypeId.ROADMAP;

  constructor(
    private cdr: ChangeDetectorRef,
    public mapsApiService: MapsApiService
  ) {
    // if (this.selectedSpot) {
    //   this.selectedSpotMarkerNode = this.buildAdvancedMarkerContent(
    //     this.selectedSpot
    //   );
    // }
  }

  isDarkMode: boolean = true; // should be false if mapStyle is roadmap and the dark map is used

  ngOnInit() {
    this.mapsApiService.isApiLoaded$.subscribe((isLoaded) => {
      if (isLoaded) {
        this.initMap();
        this.initGeolocation();
      }
    });

    if (this.boundRestriction) {
      this.mapOptions.restriction = {
        latLngBounds: this.boundRestriction,
        strictBounds: false,
      };
    }
    if (this.minZoom) {
      this.mapOptions.minZoom = this.minZoom;
    }
  }

  initMap(): void {
    // this.geolocationMarkerOptions = {
    //   gmpDraggable: false,
    //   gmpClickable: false,
    //   //   icon: {
    //   //     url: "assets/icons/geolocation-16x16.png",
    //   //     scaledSize: new google.maps.Size(16, 16),
    //   //     anchor: new google.maps.Point(8, 8),
    //   //   },
    //   zIndex: 1000,
    // };
    // this.primaryDotMarkerOptions = {
    //   gmpDraggable: false,
    //   gmpClickable: false,
    //   //   opacity: 0.8,
    //   //   icon: {
    //   //     url: "assets/icons/circle-primary-16x16.png",
    //   //     scaledSize: new google.maps.Size(16, 16),
    //   //     anchor: new google.maps.Point(8, 8),
    //   //   },
    // };
    // this.teriaryDotMarkerOptions = {
    //   gmpDraggable: false,
    //   gmpClickable: false,
    //   //   opacity: 0.8,
    //   //   icon: {
    //   //     url: "assets/icons/circle-tertiary-16x16.png",
    //   //     scaledSize: new google.maps.Size(16, 16),
    //   //     anchor: new google.maps.Point(8, 8),
    //   //   },
    // };
  }

  private _geoPointToLatLng(
    geoPoint: GeoPoint
  ): google.maps.LatLngLiteral | null {
    return geoPoint
      ? { lat: geoPoint.latitude, lng: geoPoint.longitude }
      : null;
  }

  initGeolocation() {
    navigator.permissions.query({ name: "geolocation" }).then((permission) => {
      if (permission.state == "granted") {
        this.useGeolocation();
      }
    });
  }

  //   buildAdvancedMarkerContent(spot: Spot.Class): HTMLDivElement {
  //     const content = document.createElement("div");
  //     content.classList.add("advanced-spot-marker");
  //     content.innerHTML = `
  //       <div>${spot.rating ?? 7}</div>
  //     `; // TODO remove 7

  //     return content;
  //   }

  useGeolocation() {
    if (this.showGeolocation) {
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
          this.hasGeolocationChange.emit(true);
        },
        (error) => {
          console.error(error);
          navigator.geolocation.clearWatch(geolocationWatchId);
          this.geolocation$.complete();
          this.hasGeolocationChange.emit(false);
        },
        {
          enableHighAccuracy: true,
        }
      );
    }

    this.cdr.detectChanges();
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

  //   mapStylesConfig = map_style;

  mapOptions: google.maps.MapOptions = {
    mapId: environment.mapId,
    backgroundColor: "#000000",
    clickableIcons: false,
    gestureHandling: "greedy",
    disableDefaultUI: true,
  };

  spotCircleDarkOptions: google.maps.CircleOptions = {
    fillColor: "#b8c4ff",
    strokeColor: "#0036ba",
    fillOpacity: 0.8,
    strokeOpacity: 0.8,
    strokeWeight: 3,
    draggable: false,
    clickable: true,
  };
  spotCircleLightOptions: google.maps.CircleOptions = {
    fillColor: "#0036ba",
    strokeColor: "#b8c4ff",
    fillOpacity: 0.5,
    strokeOpacity: 0.8,
    strokeWeight: 3,
    draggable: false,
    clickable: true,
  };
  spotCircleOptions: google.maps.CircleOptions = this.spotCircleDarkOptions;

  spotPolygonDarkOptions: google.maps.PolygonOptions = {
    fillColor: "#b8c4ff",
    strokeColor: "#0036ba",
    strokeOpacity: 0.8,
    fillOpacity: 0.8,
    strokeWeight: 3,
    editable: false,
    draggable: false,
    clickable: true,
  };
  spotPolygonLightOptions: google.maps.PolygonOptions = {
    fillColor: "#0036ba",
    strokeColor: "#b8c4ff",
    strokeOpacity: 0.8,
    fillOpacity: 0.5,
    strokeWeight: 3,
    editable: false,
    draggable: false,
    clickable: true,
  };
  spotPolygonOptions: google.maps.PolygonOptions = this.spotPolygonDarkOptions;
  //   spotPolygonEditingOptions: google.maps.PolygonOptions = {
  //     ...this.spotPolygonOptions,
  //     editable: true,
  //   };

  geolocationCircleOptions: google.maps.CircleOptions = {
    fillColor: "#0000ff",
    fillOpacity: 0.1,
    draggable: false,
    clickable: false,
    strokeWeight: 0,
  };

  toggleMapStyle() {
    if (
      this.mapTypeId.toLowerCase() ===
      google.maps.MapTypeId.ROADMAP.toLowerCase()
    ) {
      // if it is equal to roadmap, toggle to satellite
      this.mapTypeId = google.maps.MapTypeId.SATELLITE;
      this.setLightMode();
    } else {
      // otherwise toggle back to roadmap
      this.mapTypeId = google.maps.MapTypeId.ROADMAP;
      this.setDarkMode();
    }
  }

  setLightMode() {
    this.isDarkMode = false;
    //     this.heatmapOptions = this.heatmapLightOptions;
    this.spotCircleOptions = this.spotCircleLightOptions;
    this.spotPolygonOptions = this.spotPolygonLightOptions;
    //     this.selectedSpotMarkerOptions = this.selectedSpotMarkerLightOptions;
  }
  setDarkMode() {
    this.isDarkMode = true;
    //     this.heatmapOptions = this.heatmapDarkOptions;
    this.spotCircleOptions = this.spotCircleDarkOptions;
    this.spotPolygonOptions = this.spotPolygonDarkOptions;
    //     this.selectedSpotMarkerOptions = this.selectedSpotMarkerDarkOptions;
  }

  emitBoundsChanged() {
    const bounds = this.googleMap.getBounds();
    this.boundsChange.emit(bounds);
  }

  emitCenterChanged() {
    const center = this.googleMap.getCenter();
    this.centerChange.emit(center.toJSON());
  }

  fitBounds(bounds: google.maps.LatLngBounds) {
    this.googleMap.fitBounds(bounds);
  }

  editingSpotPositionChanged(position: google.maps.LatLng) {
    this.selectedSpot.location = position.toJSON();
  }

  geopointToLatLngLiteral(geoPoint: GeoPoint): google.maps.LatLngLiteral {
    if (!geoPoint) throw new Error("No GeoPoint provided");
    if (!geoPoint.latitude || !geoPoint.longitude)
      throw new Error("Invalid GeoPoint provided");

    return { lat: geoPoint.latitude, lng: geoPoint.longitude };
  }

  clickOnDot(dot: SpotClusterDot) {
    if (dot.spot_id) {
      this.spotClick.emit(dot.spot_id as SpotId);
    } else {
      const location: google.maps.LatLng = new google.maps.LatLng(
        dot.location.latitude,
        dot.location.longitude
      );
      this.focusOnLocation(location, Math.min(this.zoom + 4, 17));
    }
  }

  focusOnLocation(
    location: google.maps.LatLngLiteral | google.maps.LatLng,
    zoom: number = 17
  ) {
    if (!location) {
      console.warn("No or invalid location provided to focus on", location);
      console.trace();
      return;
    }

    this.googleMap.panTo(location);
    this.setZoom(zoom);
  }

  focusOnGeolocation() {
    let geolocation = this.geolocation$.value;
    if (geolocation) {
      this.focusOnLocation(geolocation.location);
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
