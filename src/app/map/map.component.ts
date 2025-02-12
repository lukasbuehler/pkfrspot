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
  computed,
  input,
  InputSignal,
  Signal,
  model,
  ModelSignal,
} from "@angular/core";
import { LocalSpot, Spot, SpotId } from "../../db/models/Spot";
import { SpotPreviewData } from "../../db/schemas/SpotPreviewData";

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
  SpotClusterDotSchema,
  SpotClusterTileSchema,
} from "../../db/schemas/SpotClusterTile.js";
import { GeoPoint } from "firebase/firestore";
import { NgIf, NgFor, AsyncPipe, NgClass } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { trigger, transition, style, animate } from "@angular/animations";
import { MarkerComponent, MarkerSchema } from "../marker/marker.component";

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
    MarkerComponent,
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
  @ViewChild("googleMap") googleMap: GoogleMap | undefined;
  @ViewChildren(MapPolygon) polygons: QueryList<MapPolygon> | undefined;
  @ViewChildren(MapPolygon, { read: ElementRef })
  polygonElements: QueryList<ElementRef> | undefined;
  @ViewChild("selectedSpotMarkerNode") selectedSpotMarkerNode: Node | undefined;

  // add math function to markup
  sqrt = Math.sqrt;

  isDarkMode = input<boolean>(true); // should be false if mapStyle is roadmap and the dark map is used
  markers = input<MarkerSchema[]>([]);

  private _center: google.maps.LatLngLiteral | undefined;
  @Input() set center(coords: google.maps.LatLngLiteral) {
    this._center = coords;
    if (this.googleMap) {
      this.googleMap.panTo(this._center);
    }
  }
  @Output() centerChange = new EventEmitter<google.maps.LatLngLiteral>();
  get center(): google.maps.LatLngLiteral | undefined {
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
    this.zoom = newZoom;
    this.zoomChange.emit(this._zoom);
  }

  getAndEmitChangedZoom() {
    if (!this.googleMap) return;
    this._zoom = this.googleMap.getZoom()!;
    this.zoomChange.emit(this._zoom);
  }

  @Output() boundsChange = new EventEmitter<google.maps.LatLngBounds>();
  @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
  @Output() spotClick = new EventEmitter<Spot | SpotPreviewData | SpotId>();
  @Output() polygonChanged = new EventEmitter<{
    spotId: string;
    path: google.maps.LatLngLiteral[][];
  }>();
  @Output() hasGeolocationChange = new EventEmitter<boolean>();

  @Input() spots: Spot[] = [];
  @Input() dots: SpotClusterDotSchema[] = [];

  @Input() selectedSpot: Spot | LocalSpot | null = null;
  @Input() isEditing: boolean = false;
  @Input() showGeolocation: boolean = false;
  @Input() selectedMarker: google.maps.LatLngLiteral | null = null;

  @Input() boundRestriction: {
    north: number;
    south: number;
    west: number;
    east: number;
  } | null = null;
  @Input() minZoom: number = 4;

  mapStyle = input<"roadmap" | "satellite">("roadmap");

  mapTypeId: Signal<google.maps.MapTypeId> = computed(() => {
    switch (this.mapStyle()) {
      case "roadmap":
        return google.maps.MapTypeId.ROADMAP;
      case "satellite":
        return google.maps.MapTypeId.SATELLITE;
      default:
        return google.maps.MapTypeId.ROADMAP;
    }
  });

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

    this.setZoom(this._zoom);
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

  geolocation$ = new BehaviorSubject<{
    location: google.maps.LatLngLiteral;
    accuracy: number;
  } | null>(null);

  //spotDotZoomRadii: number[] = Array<number>(16);

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

  // convert options to computed signals
  // setLightMode() {
  //   this.isDarkMode = false;
  //   //     this.heatmapOptions = this.heatmapLightOptions;
  //   this.spotCircleOptions = this.spotCircleLightOptions;
  //   this.spotPolygonOptions = this.spotPolygonLightOptions;
  //   //     this.selectedSpotMarkerOptions = this.selectedSpotMarkerLightOptions;
  // }
  // setDarkMode() {
  //   this.isDarkMode = true;
  //   //     this.heatmapOptions = this.heatmapDarkOptions;
  //   this.spotCircleOptions = this.spotCircleDarkOptions;
  //   this.spotPolygonOptions = this.spotPolygonDarkOptions;
  //   //     this.selectedSpotMarkerOptions = this.selectedSpotMarkerDarkOptions;
  // }

  emitBoundsChanged() {
    if (!this.googleMap) return;
    const bounds = this.googleMap.getBounds()!;
    this.boundsChange.emit(bounds);
  }

  emitCenterChanged() {
    if (!this.googleMap) return;
    const center = this.googleMap.getCenter()!;
    this.centerChange.emit(center.toJSON());
  }

  fitBounds(bounds: google.maps.LatLngBounds) {
    if (!this.googleMap) return;

    this.googleMap.fitBounds(bounds);
  }

  editingSpotPositionChanged(position: google.maps.LatLng) {
    if (!this.selectedSpot) return;

    this.selectedSpot.location.set(position.toJSON());
  }

  geopointToLatLngLiteral(geoPoint: GeoPoint): google.maps.LatLngLiteral {
    if (!geoPoint) throw new Error("No GeoPoint provided");
    if (!geoPoint.latitude || !geoPoint.longitude)
      throw new Error("Invalid GeoPoint provided");

    return { lat: geoPoint.latitude, lng: geoPoint.longitude };
  }

  clickOnDot(dot: SpotClusterDotSchema) {
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
    if (!this.googleMap) return;

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

  // private _getPolygonBySpotId(spotId: string): MapPolygon | undefined {
  //   console.log(this.polygonElements?.toArray());
  //   console.log(this.polygons?.toArray());

  //   const elementRef = this.polygonElements.find(
  //     (element) => element.nativeElement.id === "polygon-" + spotId
  //   );
  //   if (elementRef) {
  //     const index = this.polygonElements.toArray().indexOf(elementRef);
  //     return this.polygons.toArray()[index];
  //   }
  //   return undefined;
  // }

  // public getPolygonPathForSpot(
  //   spotId: string
  // ): google.maps.LatLngLiteral[][] | undefined {
  //   let polygon = this._getPolygonBySpotId(spotId);

  //   if (polygon) {
  //     const newPaths: google.maps.MVCArray<
  //       google.maps.MVCArray<google.maps.LatLng>
  //     > = polygon.getPaths();
  //     console.log("new paths", newPaths);

  //     // Convert LatLng[][] to LatLngLiteral[][]
  //     let literalNewPaths: Array<Array<google.maps.LatLngLiteral>> = [];
  //     literalNewPaths[0] = newPaths
  //       .getAt(0)
  //       .getArray()
  //       .map((v, i, arr) => {
  //         return { lat: v.lat(), lng: v.lng() };
  //       });

  //     return literalNewPaths;
  //   } else {
  //     console.error("No polygon found for spot with id: " + spotId);
  //     return;
  //   }
  // }
}
