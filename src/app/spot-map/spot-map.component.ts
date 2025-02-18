import {
  AfterViewInit,
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  Inject,
  input,
  Input,
  InputSignal,
  LOCALE_ID,
  model,
  ModelSignal,
  OnChanges,
  Output,
  PLATFORM_ID,
  Signal,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { LocalSpot, Spot, SpotId } from "../../db/models/Spot";
import { SpotPreviewData } from "../../db/schemas/SpotPreviewData";
import { ActivatedRoute } from "@angular/router";
import { GeoPoint } from "firebase/firestore";
import { firstValueFrom, retry } from "rxjs";
import { MapHelpers } from "../../scripts/MapHelpers";
import { AuthenticationService } from "../services/firebase/authentication.service";
import { MapComponent, TilesObject } from "../map/map.component";
import {
  ClusterTileKey,
  getClusterTileKey,
  getDataFromClusterTileKey,
  SpotClusterDotSchema,
  SpotClusterTileSchema,
} from "../../db/schemas/SpotClusterTile";
import { MapsApiService } from "../services/maps-api.service";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { isPlatformServer } from "@angular/common";
import { SpotsService } from "../services/firebase/firestore/spots.service";
import { LocaleCode } from "../../db/models/Interfaces";
import { MarkerSchema } from "../marker/marker.component";
import { OsmDataService } from "../services/osm-data.service";
import { MapClusterStore } from "./MapClusterStore";

/**
 * This interface is used to reference a spot in the loaded spots array.
 */
interface LoadedSpotReference {
  spot: Spot;
  tile: { x: number; y: number };
  indexInTileArray: number;
  indexInTotalArray: number;
}

@Component({
  selector: "app-spot-map",
  templateUrl: "./spot-map.component.html",
  styleUrls: ["./spot-map.component.scss"],
  imports: [MapComponent, MatSnackBarModule],
  animations: [],
})
export class SpotMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild("map") map: MapComponent | undefined;

  osmDataService = inject(OsmDataService);

  selectedSpot = model<Spot | LocalSpot | null>(null); // input and output signal
  isEditing = model<boolean>(false);
  mapStyle = model<"roadmap" | "satellite">("roadmap");
  markers = input<MarkerSchema[]>([]);
  selectedMarker = input<google.maps.LatLngLiteral | null>(null);
  focusZoom = input<number>(17);
  isClickable = input<boolean>(true);
  showAmenities = input<boolean>(false);

  @Input() showGeolocation: boolean = true;
  @Input() showSatelliteToggle: boolean = false;
  @Input() minZoom: number = 2;
  @Input() boundRestriction: {
    north: number;
    south: number;
    west: number;
    east: number;
  } | null = null;
  @Input() spots: Spot[] = [];

  @Output() hasGeolocationChange = new EventEmitter<boolean>();
  @Output() visibleSpotsChange = new EventEmitter<Spot[]>();
  @Output() hightlightedSpotsChange = new EventEmitter<SpotPreviewData[]>();

  uneditedSpot?: Spot | LocalSpot;

  startZoom: number = 4;
  mapZoom: number = this.startZoom;
  mapCenterStart: google.maps.LatLngLiteral = {
    lat: 48.6270939,
    lng: 2.4305363,
  };
  mapCenter?: google.maps.LatLngLiteral;
  bounds?: google.maps.LatLngBounds;

  //this is a map of tile keys to spot arrays
  loadedSpots: Map<ClusterTileKey, Spot[]> = new Map<ClusterTileKey, Spot[]>();
  visibleSpots: Spot[] = [];

  // markers for water and toilets
  loadedInputMarkers: Signal<Map<ClusterTileKey, MarkerSchema[]>> = computed(
    () => {
      const map = new Map<ClusterTileKey, MarkerSchema[]>();

      if (this.markers.length > 0) {
        this.markers().forEach((marker) => {
          const tile = MapHelpers.getTileCoordinatesForLocationAndZoom(
            marker.location,
            16
          );
          const key = getClusterTileKey(16, tile.x, tile.y);
          if (map.has(key)) {
            map.get(key)?.push(marker);
          } else {
            map.set(key, [marker]);
          }
        });
      }

      return map;
    }
  );
  loadedAmenityMarkers: Map<ClusterTileKey, MarkerSchema[]> = new Map<
    ClusterTileKey,
    MarkerSchema[]
  >();
  visibleAmenityMarkers: MarkerSchema[] = [];
  visibleMarkers: MarkerSchema[] = [];

  cachedClusterTiles: MapClusterStore = new MapClusterStore();
  hightlightedSpots: SpotPreviewData[] = [];
  visibleDots: SpotClusterDotSchema[] = [];

  // previous tile coordinates used to check if the visible tiles have changed
  private _previousTileZoom: 4 | 8 | 12 | 16 | undefined;
  private _previousSouthWestTile: google.maps.Point | undefined;
  private _previousNorthEastTile: google.maps.Point | undefined;
  private _visibleTiles: Set<ClusterTileKey> = new Set<ClusterTileKey>();
  private _visibleTilesObj: TilesObject | undefined;

  constructor(
    @Inject(LOCALE_ID) public locale: LocaleCode,
    private _spotsService: SpotsService,
    private authService: AuthenticationService,
    private mapsAPIService: MapsApiService,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef // <-- Inject ChangeDetectorRef
  ) {
    effect(() => {
      const spot = this.selectedSpot();
      if (spot) {
        this.focusSpot(spot);
      }
    });
  }

  isInitiated: boolean = false;

  ngAfterViewInit(): void {
    if (!this.selectedSpot) {
      // load the last location and zoom from memory
      this.mapsAPIService
        .loadLastLocationAndZoom()
        .then((lastLocationAndZoom) => {
          if (this.map) {
            if (lastLocationAndZoom) {
              this.map.center = lastLocationAndZoom.location;
              this.mapZoom = lastLocationAndZoom.zoom;
            } else {
              this.map.center = this.mapCenterStart;
              this.mapZoom = this.startZoom;
            }
          }
          this.isInitiated = true;
        });
    }
  }

  ngOnDestroy(): void {
    if (this.dotsTimeout) {
      clearTimeout(this.dotsTimeout);
    }
  }

  // Map events ///////////////////////////////////////////////////////////////

  zoomChanged(zoom: number) {
    this.mapZoom = zoom;
  }

  mapClick(event: google.maps.LatLngLiteral) {
    /**
     * When the map is clicked with a spot open, the spot is
     * closed and the bottom panel cloes as well.
     */
    if (this.selectedSpot()) {
      this.closeSpot();
    }
  }

  focusOnGeolocation() {
    if (!this.map) return;

    this.map.useGeolocation();
    this.map.focusOnGeolocation();
  }

  visibleTilesChanged(visibleTilesObj: TilesObject) {
    this._visibleTilesObj = visibleTilesObj;
    if (!visibleTilesObj) return;
    // compute the tiles for this zoom level
    // that is only 4, 8, 12 and 16 since we are only loading spots and dots for these zoom levels
    const zoom = visibleTilesObj.zoom;

    const clampedZoom = Math.max(Math.min(zoom, 16), 4);
    const tileZoom = (clampedZoom - (clampedZoom % 4)) as 4 | 8 | 12 | 16;
    const shift = zoom - tileZoom;
    const tileSw = new google.maps.Point(
      visibleTilesObj.sw.x >> shift,
      visibleTilesObj.sw.y >> shift
    );
    const tileNe = new google.maps.Point(
      visibleTilesObj.ne.x >> shift,
      visibleTilesObj.ne.y >> shift
    );
    const tileVisibleTilesObj: TilesObject = {
      zoom: tileZoom,
      sw: tileSw,
      ne: tileNe,
      tiles: visibleTilesObj.tiles.map((tile) => {
        return {
          x: tile.x >> shift,
          y: tile.y >> shift,
        };
      }),
    };

    // make a list of all the tiles that are visible for this tile zoom to show only those dots/spots
    const visibleTiles = new Set<ClusterTileKey>();
    console.log("Visible tiles changed", tileZoom, tileSw, tileNe);
    for (let x = tileSw.x; x <= tileNe.x; x++) {
      for (let y = tileNe.y; y <= tileSw.y; y++) {
        // here we go through all the x,y pairs for every visible tile on screen right now
        // and add them to the set of visible tiles
        visibleTiles.add(getClusterTileKey(tileZoom, x, y));
      }
    }
    this._visibleTiles = visibleTiles;

    if (tileZoom >= 16) {
      // spots are close enough to render in detail
      this.visibleDots = [];
      // TODO what happens to the highlighted spots? they just stay the same until zoom is 16 or smaller again

      this.updateVisibleSpotsAndMarkers(visibleTiles);

      const tilesToLoad: Set<ClusterTileKey> =
        this.getUnloadedVisibleZ16Tiles(visibleTiles);

      this.loadSpotsForTiles(tilesToLoad);

      this.loadAmeinitesForTiles(visibleTiles);
    } else {
      // show clustered dots instead of spots
      this.clearVisibleSpots();

      // now update the visible dots to show all the loaded dots for the visible tiles
      this.updateVisibleDotsAndHighlightedSpots(visibleTilesObj);

      // now that the visible tiles have been updated, we can load new spots and dots if necessary
      // for that we call getUnloadedVisibleTiles to figure out if/which new tiles need to be loaded

      const tilesToLoad: Set<ClusterTileKey> =
        this.getUnloadedVisibleClusterTiles(tileVisibleTilesObj);

      this.loadNewClusterTiles(tilesToLoad);
    }
  }

  mapBoundsChanged(bounds: google.maps.LatLngBounds, zoom: number) {
    // update the local bounds variable
    this.bounds = bounds;

    // store the new last location in the browser memory to restore it on next visit
    // let newCenter: google.maps.LatLngLiteral = bounds.getCenter().toJSON();
    // if (this.isInitiated && newCenter !== this.mapCenterStart) {
    //   if (this.mapCenter !== newCenter || zoom !== this.mapZoom) {
    //     this.mapsAPIService.storeLastLocationAndZoom({
    //       location: newCenter,
    //       zoom: zoom,
    //     });
    //   }
    // }
  }

  // Spot loading /////////////////////////////////////////////////////////////

  getAllLoadedSpots(): Spot[] {
    const allSpots: Spot[] = [];
    for (const key of this.loadedSpots.keys()) {
      if (!key.includes("z16")) continue;

      const loadedSpots = this.loadedSpots.get(key);
      if (!loadedSpots) continue;

      allSpots.concat(loadedSpots);
    }

    return allSpots;
  }

  /**
   * This function takes in the set of visible tile keys and checks whether these
   * tiles are already loaded or not. If they are not yet loaded it returns
   * the set of all those keys that need to be loaded. If there are no new tiles
   * to load, it returns an empty set.
   * @param visibleTilesObj
   * @returns
   */
  getUnloadedVisibleClusterTiles(
    visibleTilesObj: TilesObject
  ): Set<ClusterTileKey> {
    if (this.mapZoom >= 16) {
      throw new Error(
        "This function should only be called for zoom levels smaller than 16"
      );
    }

    const tilesToLoad = this.cachedClusterTiles.getTilesToLoad(visibleTilesObj);
    const visibleUncachedTileKeys = tilesToLoad.tiles.map((tile) => {
      return getClusterTileKey(tilesToLoad.zoom, tile.x, tile.y);
    });

    return new Set(visibleUncachedTileKeys);
  }

  getUnloadedVisibleZ16Tiles(
    visibleTiles: Set<ClusterTileKey>
  ): Set<ClusterTileKey> {
    if (this.mapZoom < 16) {
      throw new Error(
        "This function should only be called for zoom level 16 and higher"
      );
    }

    return new Set(
      [...visibleTiles].filter((tile) => !this.loadedSpots.has(tile))
    );
  }

  // Public Map helper functions

  clearVisibleSpots() {
    this.visibleSpots = [];
    this.visibleSpotsChange.emit([]);
  }

  /**
   * This function takes in the new corners of the visible area and hides and shows spots as necessairy
   * @param northEastLiteral
   * @param southWestLiteral
   */
  updateVisibleSpotsAndMarkers(
    visibleTiles: Set<ClusterTileKey> = this._visibleTiles
  ) {
    // console.log("Updating visible spots");

    // clear visible spots
    this.visibleSpots = [];

    // clear visible markers
    this.visibleMarkers = [];

    visibleTiles.forEach((tileKey) => {
      const spots = this.loadedSpots.get(tileKey);
      if (spots && spots.length > 0) {
        this.visibleSpots.push(...spots);
      }

      if (this.showAmenities()) {
        const tileData16 = getDataFromClusterTileKey(tileKey);
        const tile14 = getClusterTileKey(
          14,
          tileData16.x >> 2,
          tileData16.y >> 2
        );
        const amenityMarkers = this.loadedAmenityMarkers.get(tile14);
        // console.log("Amenity markers", amenityMarkers);
        if (amenityMarkers && amenityMarkers.length > 0) {
          this.visibleMarkers.push(...amenityMarkers);
          // console.log("Visible markers", this.visibleMarkers);
        }
      }
    });
    this.visibleSpotsChange.emit(this.visibleSpots);
    // console.log("Visible spots updated");

    // If the selected spot is visible reference the instance from the visible spots
    if (this.selectedSpot) {
      const selectedSpotIndexInVisibleSpots: number =
        this.visibleSpots.findIndex((spot) => {
          return (
            this.selectedSpot instanceof Spot &&
            this.selectedSpot.id === spot.id
          );
        });
      if (selectedSpotIndexInVisibleSpots >= 0) {
        // The selected spot is visible, reference the instance from the visible
        // spots instead of the one from the database
        this.selectedSpot.set(
          this.visibleSpots[selectedSpotIndexInVisibleSpots]
        );
      }
    }
  }

  dotsTimeout: NodeJS.Timeout | undefined;

  updateVisibleDotsAndHighlightedSpots(
    visibleTiles: TilesObject = this._visibleTilesObj,
    bounds: google.maps.LatLngBounds | undefined = this.bounds
  ) {
    this.dotsTimeout = setTimeout(() => {
      // defer update to prevent ExpressionChangedAfterItHasBeenCheckedError
      this.visibleDots = [];
      this.hightlightedSpots = [];

      const zoom = visibleTiles.zoom;
      const xStart = visibleTiles.sw.x;
      const xEnd = visibleTiles.ne.x;
      const yStart = visibleTiles.ne.y;
      const yEnd = visibleTiles.sw.y;

      const clusterTiles: SpotClusterTileSchema[] =
        this.cachedClusterTiles.getClustersForZoomAndRange(
          zoom,
          xStart,
          xEnd,
          yStart,
          yEnd
        );
      if (clusterTiles.length === 0) return;

      // const dotsInBounds = clusterTiles.dots.filter((dot) => {
      //   if (bounds) {
      //     return bounds.contains({
      //       lat: dot.location.latitude,
      //       lng: dot.location.longitude,
      //     });
      //   } else {
      //     return true;
      //   }
      // });
      const dotsInBounds = clusterTiles.map((tile) => tile.dots).flat();
      const spotsInBounds = clusterTiles.map((tile) => tile.spots).flat();

      this.visibleDots = this.visibleDots.concat(dotsInBounds);
      this.hightlightedSpots = this.hightlightedSpots.concat(spotsInBounds);

      this.hightlightedSpotsChange.emit(this.hightlightedSpots);
    }, 0);
  }

  openSpotByWhateverMeansNecessary(spot: Spot | SpotPreviewData | SpotId) {
    console.debug("Opening spot by whatever means necessary:", spot);

    if (spot instanceof Spot) {
      this.selectedSpot.set(spot);
    }
    let spotId: SpotId;

    if (typeof spot === "string") {
      spotId = spot;
    } else if ("id" in spot) {
      spotId = spot.id as SpotId;
      if ("location" in spot) {
        this.focusPoint(spot.location());
      }
    } else {
      console.error("Invalid spot data provided:", spot);
      return;
    }

    this.openSpotById(spotId);
  }

  openSpotById(spotId: SpotId) {
    if (!spotId) {
      console.error("No spot ID provided to open spot by ID");
      return;
    }

    console.log("Opening spot by ID", spotId);
    firstValueFrom(this._spotsService.getSpotById$(spotId, this.locale)).then(
      (spot) => {
        if (spot) {
          this.selectedSpot.set(spot);
        } else {
          console.error("Spot with ID", spotId, "not found");
        }
      }
    );
  }

  focusSpot(spot: Spot | LocalSpot) {
    const zoom = Math.max(this.mapZoom, this.focusZoom());

    this.focusPoint(spot.location(), zoom);
  }

  focusPoint(
    point: google.maps.LatLngLiteral,
    zoom: number = this.focusZoom()
  ) {
    this.map?.googleMap?.panTo(point);
    this.mapZoom = zoom;
  }

  focusBounds(bounds: google.maps.LatLngBounds) {
    this.map?.fitBounds(bounds);
  }

  toggleMapStyle() {
    if (this.mapStyle() === "roadmap") {
      // if it is equal to roadmap, toggle to satellite
      this.mapStyle.set("satellite");
      // this.setLightMode();
    } else {
      // otherwise toggle back to roadmap
      this.mapStyle.set("roadmap");
      // this.setDarkMode();
    }
  }

  createSpot() {
    if (!this.authService.isSignedIn) {
      // TODO show sign in dialog
      alert("Please sign in to create a spot"); // TODO
      return;
    }

    if (!this.map || !this.map.googleMap) return;

    let center_coordinates: google.maps.LatLngLiteral | undefined =
      this.map.googleMap.getCenter()?.toJSON();

    if (!center_coordinates) {
      console.error("Could not get center coordinates of the map");
      return;
    }

    this.selectedSpot.set(
      new LocalSpot(
        {
          name: { [this.locale]: $localize`New Spot` }, // TODO change to user lang
          location: new GeoPoint(
            center_coordinates.lat,
            center_coordinates.lng
          ),
        },
        this.locale as LocaleCode
      )
    );

    // sets the map and the spot to edit mode
    this.isEditing.set(true);
  }

  saveSpot(spot: Spot | LocalSpot) {
    if (!spot) return;

    // if (spot.hasBounds()) {
    //   let editedPaths = this.map.getPolygonPathForSpot(spot.id);
    //   if (editedPaths) {
    //     spot.paths = editedPaths;
    //   }
    // }

    // If the spot does not have an ID, it does not exist in the database yet.

    let saveSpotPromise: Promise<void>;
    if (spot instanceof Spot) {
      // this is an old spot that is edited
      saveSpotPromise = this._spotsService.updateSpot(spot.id, spot.data());
    } else {
      // this is a new (local) spot
      saveSpotPromise = this._spotsService
        .createSpot(spot.data())
        .then((id: SpotId) => {
          // replace the LocalSpot with a Spot
          spot = new Spot(id, spot.data(), this.locale);
          return;
        });
    }

    saveSpotPromise
      .then(() => {
        this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(spot as Spot);

        // Successfully updated
        this.isEditing.set(false);
        this.snackBar.open(
          $localize`Spot saved successfully`,
          $localize`Dismiss`
        );

        // update the selected spot so that it is displayed in the URL
        this.selectedSpot.set(null);
        this.selectedSpot.set(spot);
      })
      .catch((error) => {
        this.isEditing.set(false);
        console.error("Error saving spot:", error);
        this.snackBar.open($localize`Error saving spot`, $localize`Dismiss`);
      });
  }

  startEdit() {
    this.isEditing.set(true);

    this.uneditedSpot = this.selectedSpot()?.clone();
  }

  discardEdit() {
    // reset paths of editing polygon
    this.isEditing.set(false);

    if (!this.uneditedSpot) {
      // there is no backup unedited spot of the selected spot, therefore this is a newly created spot
      // delete local newly created spots
      //this.removeNewSpotFromLoadedSpotsAndUpdate();
      this.selectedSpot.set(null);
    } else {
      // set the selected spot to be the backup unedited spot
      this.selectedSpot.set(this.uneditedSpot);

      delete this.uneditedSpot;

      // reset the map to show the unedited spot
      // this.updateSpotInLoadedSpots(this.selectedSpot);
      // this.updateVisibleSpots();
    }
  }

  loadSpotsForTiles(tilesToLoad: Set<ClusterTileKey>) {
    if (tilesToLoad.size === 0) return;

    // add an empty array for the tiles that spots will be loaded for
    tilesToLoad.forEach((tileKey) => {
      this.loadedSpots.set(tileKey, []);
    });

    // load the spots and add them
    firstValueFrom(
      this._spotsService.getSpotsForTileKeys(
        Array.from(tilesToLoad),
        this.locale
      )
    )
      .then((spots) => {
        if (spots.length > 0) {
          spots.forEach((spot) => {
            if (!spot.tileCoordinates) return;

            const spotTile = spot.tileCoordinates.z16;
            const key: ClusterTileKey = getClusterTileKey(
              16,
              spotTile.x,
              spotTile.y
            );
            if (this.loadedSpots.has(key)) {
              this.loadedSpots.get(key)?.push(spot);
            } else {
              console.warn("aahhh");
            }
          });
          this.updateVisibleSpotsAndMarkers();
        }
      })
      .catch((err) => console.error(err));
  }

  loadNewClusterTiles(tilesToLoad: Set<ClusterTileKey>) {
    if (tilesToLoad.size === 0) return;

    firstValueFrom(
      this._spotsService.getSpotClusterTiles(Array.from(tilesToLoad))
    )
      .then((clusterTiles) => {
        if (clusterTiles.length > 0) {
          clusterTiles.forEach((clusterTile) => {
            this.cachedClusterTiles.insert(
              clusterTile.zoom,
              clusterTile.x,
              clusterTile.y,
              clusterTile
            );
          });

          this.updateVisibleDotsAndHighlightedSpots();
          if (this.mapZoom === 16) this.updateVisibleSpotsAndMarkers();
        }
      })
      .catch((err) => console.error(err));
  }

  loadAmeinitesForTiles(tiles16: Set<ClusterTileKey>) {
    if (tiles16.size === 0) return;

    // make 12 tiles from the 16 tiles
    const tiles = new Set<ClusterTileKey>();
    tiles16.forEach((tile16) => {
      const { zoom, x, y } = getDataFromClusterTileKey(tile16);
      const tile14 = getClusterTileKey(14, x >> 2, y >> 2);
      tiles.add(tile14);
    });

    // add an empty array for the tiles that water markers will be loaded for
    tiles.forEach((tileKey) => {
      if (!this.loadedAmenityMarkers.has(tileKey)) {
        this.loadedAmenityMarkers.set(tileKey, []);

        // get the bounds for the tile
        const { zoom, x, y } = getDataFromClusterTileKey(tileKey);
        const bounds = MapHelpers.getBoundsForTile(zoom, x, y);

        // load the water markers and add them
        firstValueFrom(this.osmDataService.getDrinkingWaterAndToilets(bounds))
          .then((data) => {
            const markers = data.elements
              .map((element) => {
                if (element.tags.amenity === "drinking_water") {
                  const marker: MarkerSchema = {
                    location: {
                      lat: element.lat,
                      lng: element.lon,
                    },
                    icon: "local_drink", // water_drop
                    name:
                      element.tags.name +
                      (element.tags.operator
                        ? ` (${element.tags.operator})`
                        : ""),
                    color:
                      element.tags.fee === "yes" ? "tertiary" : "secondary",
                  };
                  return marker;
                } else if (element.tags.amenity === "toilets") {
                  const marker: MarkerSchema = {
                    location: {
                      lat: element.lat,
                      lng: element.lon,
                    },
                    icon: "wc",
                    name:
                      element.tags.name +
                      (element.tags.operator
                        ? ` (${element.tags.operator})`
                        : ""),
                    color:
                      element.tags.drinking_water === "yes"
                        ? "secondary"
                        : "tertiary",
                  };
                  return marker;
                } else if (element.tags.amenity === "fountain") {
                  const marker: MarkerSchema = {
                    location: {
                      lat: element.lat,
                      lng: element.lon,
                    },
                    icon: "water_drop",
                    name:
                      element.tags.name +
                      (element.tags.operator
                        ? ` (${element.tags.operator})`
                        : ""),
                    color:
                      element.tags.drinking_water === "yes"
                        ? "secondary"
                        : "tertiary",
                  };
                  return marker;
                }
              })
              .filter((marker) => marker !== undefined);

            // console.log("Amenity markers", markers);
            this.loadedAmenityMarkers.set(tileKey, markers);
            this.updateVisibleSpotsAndMarkers();
          })
          .catch((err) => console.error(err));
      }
    });
  }

  spotMarkerMoved(event: { coords: google.maps.LatLngLiteral }) {
    if (this.selectedSpot) {
      this.selectedSpot()?.location.set(event.coords);
      this.selectedSpot()?.location.set(event.coords); // reflect move on map
    } else {
      console.error(
        "User somehow could change the spot marker position without having a spot selected"
      );
    }
  }

  /**
   * Unselect the spot and close the bottom panel
   */
  closeSpot() {
    if (this.isEditing()) {
      // TODO show dialog
      alert(
        "You are currently editing a spot. Please save or discard your changes before closing the spot."
      );
      return;
      //this.discardEdit();
    }

    // unselect
    this.selectedSpot.set(null);
  }

  /**
   * Add the first bounds to a spot. This can be used if the spot has no bounds attached to it.
   */
  addBounds() {
    if (this.selectedSpot instanceof LocalSpot) {
      console.error(
        "The spot has no ID. It needs to be saved before bounds can be added to it."
      );
      return;
    }

    const location = this.selectedSpot()?.location();
    if (!location) return;

    // TODO fix with mercator projection (this brakes at the poles)
    const dist = 0.0001;
    let _paths: Array<Array<google.maps.LatLngLiteral>> = [
      [
        { lat: location.lat + dist, lng: location.lng + dist },
        { lat: location.lat - dist, lng: location.lng + dist },
        { lat: location.lat - dist, lng: location.lng - dist },
        { lat: location.lat + dist, lng: location.lng - dist },
      ],
    ];
    this.selectedSpot.update((spot) => {
      if (!spot) return spot;
      spot.paths = _paths;
      return spot;
    });
  }

  getReferenceToLoadedSpotById(spotId: string): LoadedSpotReference | null {
    const allSpots = this.getAllLoadedSpots();

    // find the spot with no id
    const spot: Spot | undefined = allSpots.find((spot) => {
      return spot.id === spotId;
    });

    if (spot) {
      const tile = spot?.tileCoordinates?.z16!;

      const indexInTileArray = this.loadedSpots
        .get(getClusterTileKey(16, tile.x, tile.y))
        ?.indexOf(spot)!;

      const loadedSpotRef: LoadedSpotReference = {
        spot: spot,
        tile: tile,
        indexInTileArray: indexInTileArray,
        indexInTotalArray: spot ? allSpots.indexOf(spot) : -1,
      };

      return loadedSpotRef;
    } else {
      return null;
    }
  }

  /**
   * Add a newly created spot (before first save) to the loaded spots for nice display. It can be identified by having its ID set to empty string
   * @param newSpot The newly created spot class.
   */
  addOrUpdateNewSpotToLoadedSpotsAndUpdate(newSpot: Spot) {
    if (!newSpot.id) {
      throw new Error(
        "The spot has no ID. It needs to be saved before it can be added to the loaded spots."
      );
    }

    //Get the tile coordinates to save in loaded spots
    const ref = this.getReferenceToLoadedSpotById(newSpot.id);
    console.log("spot to update ref", ref);
    if (ref?.spot && ref.indexInTileArray >= 0 && ref.tile) {
      // The spot exists and should be updated
      // Update the spot
      this.loadedSpots.get(getClusterTileKey(16, ref.tile.x, ref.tile.y))![
        ref.indexInTileArray
      ] = newSpot;
    } else {
      // the spot does not exist

      // get the tile coordinates for the location of the new spot
      let tile = MapHelpers.getTileCoordinatesForLocationAndZoom(
        newSpot.location(),
        16
      );
      let spots = this.loadedSpots.get(getClusterTileKey(16, tile.x, tile.y));

      if (spots && spots.length > 0) {
        // There are spots loaded for this 16 tile, add the new spot to the loaded spots array
        spots.push(newSpot);
      } else {
        // There are no spots loaded for this 16 tile, add it to the loaded spots
        spots = [newSpot];
      }
      this.loadedSpots.set(getClusterTileKey(16, tile.x, tile.y), spots);
    }
    // update the map to show the new spot on the loaded spots array.
    this.updateVisibleSpotsAndMarkers();
  }

  /**
   * This function is used if the new spot was saved and now has an id. It replaces the first spot it finds with no ID with the newSaveSpot
   * @param newSavedSpot The new spot that replaces the unsaved new spot
   */
  updateNewSpotIdOnLoadedSpotsAndUpdate(newSavedSpot: Spot) {
    if (newSavedSpot.id) {
      // TODO
    } else {
      console.error(
        "The newly saved spot doesn't have an ID attached to it. Something is wrong"
      );
    }
  }

  // Other public functions ///////////////////////////////////////////////////

  // calculateAllDotRadii() {
  //   for (let i = 0; i < 16; i++) {
  //     this.spotDotZoomRadii[i] = this.calculateDotRadius(i);
  //   }
  // }

  // calculateDotRadius(zoom: number) {
  //   let radius = 10 * (1 << (16 - zoom));
  //   return radius;
  // }

  // calculateAllDotOpcacities() {
  //   for (let zoom = 0; zoom < 16; zoom++) {
  //     const opacity = Math.min(Math.max((zoom - 4) / 20, 0.05), 0.8);
  //     this.zoomDotOpacities.push(opacity);
  //   }
  // }

  // oldDotRadius(zoom, location) {
  //   let mercator = Math.cos((location.latitude * Math.PI) / 180);
  //   let radius = 5 * (1 << (16 - zoom)) * (1 / mercator);
  //   return radius;
  // }
}
