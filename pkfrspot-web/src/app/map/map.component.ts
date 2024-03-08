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
import { map_style } from "./map_style";
import { Spot } from "src/scripts/db/Spot";
import { GoogleMap, MapPolygon } from "@angular/google-maps";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
import { MapsApiService } from "../maps-api.service";
import { SpotClusterTile } from "src/scripts/db/SpotClusterTile.js";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
})
export class MapComponent implements OnInit {
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
    return this._zoom ?? 4;
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
  @Output() hasGeolocationChange = new EventEmitter<boolean>();

  @Input() spots: Spot.Class[] = [];

  heatmapData: google.maps.visualization.WeightedLocation[] = [];
  _dots: SpotClusterTile["points"] = [];
  @Input() set dots(newDots: SpotClusterTile["points"]) {
    this._dots = newDots;
    this.heatmapData = this.heatmapDataFromDots(newDots);
  }
  get dots() {
    return this._dots;
  }

  @Input() selectedSpot: Spot.Class | null = null;
  @Input() isEditing: boolean = false;
  @Input() showGeolocation: boolean = false;
  @Input() markers: google.maps.LatLngLiteral[] = [];
  @Input() selectedMarker: google.maps.LatLngLiteral | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    public mapsApiService: MapsApiService
  ) {}

  ngOnInit() {
    this.mapsApiService.isApiLoaded$.subscribe((isLoaded) => {
      if (isLoaded) {
        this.initGeolocation();
        this.initMap();
      }
    });
  }

  initMap(): void {
    this.geolocationMarkerOptions = {
      draggable: false,
      clickable: false,
      opacity: 1,
      icon: {
        url: "/assets/icons/geolocation-16x16.png",
        scaledSize: new google.maps.Size(16, 16),
        anchor: new google.maps.Point(8, 8),
      },
      zIndex: 1000,
    };
    this.primaryDotMarkerOptions = {
      draggable: false,
      clickable: false,
      opacity: 0.8,
      icon: {
        url: "/assets/icons/circle-primary-16x16.png",
        scaledSize: new google.maps.Size(16, 16),
        anchor: new google.maps.Point(8, 8),
      },
    };
    this.teriaryDotMarkerOptions = {
      draggable: false,
      clickable: false,
      opacity: 0.8,
      icon: {
        url: "/assets/icons/circle-tertiary-16x16.png",
        scaledSize: new google.maps.Size(16, 16),
        anchor: new google.maps.Point(8, 8),
      },
    };
  }

  heatmapDataFromDots(
    dots: SpotClusterTile["points"]
  ): google.maps.visualization.WeightedLocation[] {
    return dots.map((dot) => {
      return {
        location: new google.maps.LatLng(
          dot.location.latitude,
          dot.location.longitude
        ),
        weight: dot.weight,
      };
    });
  }

  initGeolocation() {
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

  heatmapOptions: google.maps.visualization.HeatmapLayerOptions = {
    radius: 20,
    gradient: ["rgba(184,196,255,0)", "rgba(184,196,255,1)"],
    dissipating: true,
    maxIntensity: 1,
    opacity: 0.7,
  };

  selectedSpotMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    clickable: false,
    icon: {
      url: "/assets/icons/marker-primary.png",
    },
    opacity: 1,
  };
  selectedSpotMarkerEditingOptions: google.maps.MarkerOptions = {
    draggable: true,
    clickable: false,
    crossOnDrag: true,
    icon: {
      url: "/assets/icons/marker-primary.png",
    },
    opacity: 1,
  };
  tertiaryMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    clickable: false,
    icon: {
      url: "/assets/icons/marker-tertiary.png",
    },
  };
  teriaryDotMarkerOptions: google.maps.MarkerOptions;
  noSelectedSpotMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    clickable: false,
    icon: {
      url: "/assets/icons/marker-primary.png",
    },
    opacity: 0,
  };
  geolocationMarkerOptions: google.maps.MarkerOptions;
  primaryDotMarkerOptions: google.maps.MarkerOptions;
  spotCircleOptions: google.maps.CircleOptions = {
    fillColor: "#b8c4ff",
    fillOpacity: 0.7,
    strokeColor: "#b8c4ff",
    draggable: false,
    clickable: true,
    strokeWeight: 0,
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
    fillOpacity: 0.5,
    editable: false,
    draggable: false,
    clickable: true,
  };
  spotPolygonEditingOptions: google.maps.PolygonOptions = {
    fillColor: "#b8c4ff",
    strokeColor: "#b8c4ff",
    fillOpacity: 0.2,
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
