import { BehaviorSubject, firstValueFrom } from "rxjs";
import { LocalSpot, Spot, SpotId } from "../../db/models/Spot";
import {
  MapTileKey,
  getClusterTileKey,
  getDataFromClusterTileKey,
  SpotClusterDotSchema,
  SpotClusterTileSchema,
} from "../../db/schemas/SpotClusterTile";
import { TilesObject } from "../map/map.component";
import { MarkerSchema } from "../marker/marker.component";
import { inject, signal } from "@angular/core";
import { SpotsService } from "../services/firebase/firestore/spots.service";
import { LocaleCode } from "../../db/models/Interfaces";
import { OsmDataService } from "../services/osm-data.service";
import { MapHelpers } from "../../scripts/MapHelpers";

/**
 * This interface is used to reference a spot in the loaded spots array.
 */
interface LoadedSpotReference {
  spot: Spot;
  tile: { x: number; y: number };
  indexInTileArray: number;
  indexInTotalArray: number;
}

/**
 *
 *
 */
export class SpotMapDataManager {
  _spotsService = inject(SpotsService);
  _osmDataService = inject(OsmDataService);

  private _spotClusterTiles: Map<MapTileKey, SpotClusterTileSchema>;
  private _spotClusterKeysByZoom: Map<number, Map<string, MapTileKey>>;
  private _spots: Map<MapTileKey, Spot[]>;
  private _markers: Map<MapTileKey, MarkerSchema[]>;
  private _tilesLoading: Set<MapTileKey>;

  private _visibleSpotsBehaviorSubject = new BehaviorSubject<Spot[]>([]);
  private _visibleDotsBehaviorSubject = new BehaviorSubject<
    SpotClusterDotSchema[]
  >([]);
  private _visibleMarkersBehaviorSubject = new BehaviorSubject<MarkerSchema[]>(
    []
  );

  public visibleSpots$ = this._visibleSpotsBehaviorSubject.asObservable();
  public visibleDots$ = this._visibleDotsBehaviorSubject.asObservable();
  public visibleMarkers$ = this._visibleMarkersBehaviorSubject.asObservable();

  private _lastVisibleTiles = signal<TilesObject | null>(null);

  readonly spotZoom = 16;
  readonly markerZoom = 12;
  readonly clusterZooms = [4, 8, 12];
  readonly divisor = 4;

  constructor(readonly locale: LocaleCode, readonly debugMode: boolean = true) {
    this._spotClusterTiles = new Map<MapTileKey, SpotClusterTileSchema>();
    this._spotClusterKeysByZoom = new Map<number, Map<string, MapTileKey>>();
    this._spots = new Map<MapTileKey, Spot[]>();
    this._markers = new Map<MapTileKey, MarkerSchema[]>();
    this._tilesLoading = new Set<MapTileKey>();
  }

  // public functions

  setVisibleTiles(visibleTilesObj: TilesObject) {
    // update the visible tiles
    this._lastVisibleTiles.set(visibleTilesObj);

    const zoom = visibleTilesObj.zoom;

    if (zoom >= this.spotZoom) {
      // show spots and markers
      this._showCachedSpotsAndMarkersForTiles(visibleTilesObj);

      // now determine the missing information and load spots and markers for it
      const spotTilesToLoad: Set<MapTileKey> =
        this._getSpotTilesToLoad(visibleTilesObj);
      const markerTilesToLoad: Set<MapTileKey> =
        this._getMarkerTilesToLoad(visibleTilesObj);

      // load spots for missing tiles
      this._loadSpotsForTiles(spotTilesToLoad);

      // load markers for missing tiles
      this._loadMarkersForTiles(markerTilesToLoad);
    } else {
      // show spot clusters
      this._showCachedSpotClustersForTiles(visibleTilesObj);

      // now determine missing information and load spot clusters for that
    }

    // const clampedZoom = Math.max(Math.min(zoom, 16), 4);
    // const tileZoom = (clampedZoom - (clampedZoom % 4)) as 4 | 8 | 12 | 16;

    // // make a list of all the tiles that are visible for this tile zoom to show only those dots/spots
    // const visibleTiles = new Set<ClusterTileKey>();
    // console.debug("Visible tiles changed", tileZoom, tileSw, tileNe);
    // for (let x = tileSw.x; x <= tileNe.x; x++) {
    //   for (let y = tileNe.y; y <= tileSw.y; y++) {
    //     // here we go through all the x,y pairs for every visible tile on screen right now
    //     // and add them to the set of visible tiles
    //     visibleTiles.add(getClusterTileKey(tileZoom, x, y));
    //   }
    // }

    // if (tileZoom === 16) {
    //   // spots are close enough to render in detail
    //   this._visibleDotsBehaviorSubject.next([]);

    //   // TODO what happens to the highlighted spots? they just stay the same until zoom is 16 or smaller again

    //   this.updateVisibleSpotsAndMarkers(visibleTiles);

    //   const tilesToLoad: Set<ClusterTileKey> =
    //     this.getUnloadedVisibleZ16Tiles(visibleTiles);

    //   this.loadSpotsForTiles(tilesToLoad);

    //   this.loadAmeinitesForTiles(visibleTiles);
    // } else {
    //   // show clustered dots instead of spots
    //   this.clearVisibleSpots();

    //   // now update the visible dots to show all the loaded dots for the visible tiles
    //   this.updateVisibleDotsAndHighlightedSpots(visibleTilesObj);

    //   // now that the visible tiles have been updated, we can load new spots and dots if necessary
    //   // for that we call getUnloadedVisibleTiles to figure out if/which new tiles need to be loaded

    //   const tilesToLoad: Set<ClusterTileKey> =
    //     this.getUnloadedVisibleClusterTiles(tileVisibleTilesObj);

    //   this.loadNewClusterTiles(tilesToLoad);
    // }
  }

  // saveSpot(spot: Spot | LocalSpot) {
  //   if (!spot) return;

  //   // if (spot.hasBounds()) {
  //   //   let editedPaths = this.map.getPolygonPathForSpot(spot.id);
  //   //   if (editedPaths) {
  //   //     spot.paths = editedPaths;
  //   //   }
  //   // }

  //   // If the spot does not have an ID, it does not exist in the database yet.

  //   let saveSpotPromise: Promise<void>;
  //   if (spot instanceof Spot) {
  //     // this is an old spot that is edited
  //     saveSpotPromise = this._spotsService.updateSpot(spot.id, spot.data());
  //   } else {
  //     // this is a new (local) spot
  //     saveSpotPromise = this._spotsService
  //       .createSpot(spot.data())
  //       .then((id: SpotId) => {
  //         // replace the LocalSpot with a Spot
  //         spot = new Spot(id, spot.data(), this.locale);
  //         return;
  //       });
  //   }

  //   saveSpotPromise
  //     .then(() => {
  //       this.addOrUpdateNewSpotToLoadedSpotsAndUpdate(spot as Spot);

  //       // Successfully updated
  //       this.isEditing.set(false);
  //       this.snackBar.open(
  //         $localize`Spot saved successfully`,
  //         $localize`Dismiss`
  //       );

  //       // update the selected spot so that it is displayed in the URL
  //       this.selectedSpot.set(null);
  //       this.selectedSpot.set(spot);
  //     })
  //     .catch((error) => {
  //       this.isEditing.set(false);
  //       console.error("Error saving spot:", error);
  //       this.snackBar.open($localize`Error saving spot`, $localize`Dismiss`);
  //     });
  // }

  // private functions

  /**
   * Set the spots and markers behavior subjects to the cached data we have
   * loaded.
   * @param tiles
   */
  private _showCachedSpotsAndMarkersForTiles(tiles: TilesObject) {
    // assume the zoom is larger or equal to 16
    if (tiles.zoom < this.spotZoom) {
      console.error(
        "the zoom is less than 16, this function should not be called"
      );
      return;
    }

    // get the tiles object for the spot zoom
    const tiles16 = this._transformTilesObjectToZoom(tiles, this.spotZoom);

    // get the spots and markers for these tiles
    const spots: Spot[] = [];
    const markers: MarkerSchema[] = [];
    tiles16.tiles.forEach((tile) => {
      const key = getClusterTileKey(tiles16.zoom, tile.x, tile.y);
      if (this._spots.has(key)) {
        const tileSpots = this._spots.get(key)!;
        spots.push(...tileSpots);
      }
      if (this._markers.has(key)) {
        const tileMarkers = this._markers.get(key)!;
        markers.push(...tileMarkers);
      }
    });

    this._visibleSpotsBehaviorSubject.next(spots);
    this._visibleMarkersBehaviorSubject.next(markers);
  }

  private _showCachedSpotClustersForTiles(tiles: TilesObject) {
    // assume the zoom is smaller than 16
    if (tiles.zoom > this.spotZoom) {
      console.error(
        "the zoom is larger than 16, this function should not be called"
      );
      return;
    }

    // get the tiles object for the cluster zoom
    const tilesZ = this.clusterZooms.find((zoom) => zoom >= tiles.zoom);
    if (!tilesZ) {
      return this.clusterZooms[0];
      // return the first cluster zoom (4), which might be larger than zoom.
    }

    const tilesZObj = this._transformTilesObjectToZoom(tiles, tilesZ);

    // get the spot clusters for these tiles
    const dots: SpotClusterDotSchema[] = [];
    tilesZObj.tiles.forEach((tile) => {
      const key = getClusterTileKey(tilesZObj.zoom, tile.x, tile.y);
      if (this._spotClusterTiles.has(key)) {
        const spotCluster = this._spotClusterTiles.get(key)!;
        dots.concat(spotCluster.dots);
      }
    });

    this._visibleDotsBehaviorSubject.next(dots);
  }

  private _loadSpotsForTiles(tilesToLoad: Set<MapTileKey>) {
    if (tilesToLoad.size === 0) return;

    // add an empty array for the tiles that spots will be loaded for
    tilesToLoad.forEach((key) => this._tilesLoading.add(key));

    // load the spots and add them
    firstValueFrom(
      this._spotsService.getSpotsForTileKeys(
        Array.from(tilesToLoad),
        this.locale
      )
    )
      .then((spots) => this._addLoadedSpots(spots))
      .catch((err) => console.error(err));
  }

  private _getMarkerTilesToLoad(
    visibleTilesObj16: TilesObject
  ): Set<MapTileKey> {
    if (visibleTilesObj16.zoom === 16) {
      return new Set<MapTileKey>();
    }

    // TODO add if tiles are already loading

    if (visibleTilesObj16.tiles.length === 0) return new Set();

    // make 12 tiles from the 16 tiles
    const tiles = new Set<MapTileKey>();
    visibleTilesObj16.tiles.forEach((tile16) => {
      const tile14 = getClusterTileKey(14, tile16.x >> 2, tile16.y >> 2);
      tiles.add(tile14);
    });

    return tiles;
  }

  private _loadMarkersForTiles(tiles12: Set<MapTileKey>) {
    // if (!tiles12 || tiles12.size === 0) return;
    // // add an empty array for the tiles that water markers will be loaded for
    // tiles12.forEach((tileKey) => {
    //   if (!this._markers.has(tileKey)) {
    //     this._markers.set(tileKey, []);
    //     // get the bounds for the tile
    //     const { zoom, x, y } = getDataFromClusterTileKey(tileKey);
    //     const bounds = MapHelpers.getBoundsForTile(zoom, x, y);
    //     // load the water markers and add them
    //     firstValueFrom(this._osmDataService.getDrinkingWaterAndToilets(bounds))
    //       .then((data) => {
    //         const markers = data.elements
    //           .map((element) => {
    //             if (element.tags.amenity === "drinking_water") {
    //               const marker: MarkerSchema = {
    //                 location: {
    //                   lat: element.lat,
    //                   lng: element.lon,
    //                 },
    //                 icon: "local_drink", // water_drop
    //                 name:
    //                   element.tags.name +
    //                   (element.tags.operator
    //                     ? ` (${element.tags.operator})`
    //                     : ""),
    //                 color:
    //                   element.tags.fee === "yes" ? "tertiary" : "secondary",
    //               };
    //               return marker;
    //             } else if (element.tags.amenity === "toilets") {
    //               const marker: MarkerSchema = {
    //                 location: {
    //                   lat: element.lat,
    //                   lng: element.lon,
    //                 },
    //                 icon: "wc",
    //                 name:
    //                   element.tags.name +
    //                   (element.tags.operator
    //                     ? ` (${element.tags.operator})`
    //                     : ""),
    //                 color:
    //                   element.tags.drinking_water === "yes"
    //                     ? "secondary"
    //                     : "tertiary",
    //               };
    //               return marker;
    //             } else if (element.tags.amenity === "fountain") {
    //               const marker: MarkerSchema = {
    //                 location: {
    //                   lat: element.lat,
    //                   lng: element.lon,
    //                 },
    //                 icon: "water_drop",
    //                 name:
    //                   element.tags.name +
    //                   (element.tags.operator
    //                     ? ` (${element.tags.operator})`
    //                     : ""),
    //                 color:
    //                   element.tags.drinking_water === "yes"
    //                     ? "secondary"
    //                     : "tertiary",
    //               };
    //               return marker;
    //             }
    //           })
    //           .filter((marker) => marker !== undefined);
    //         // console.log("Amenity markers", markers);
    //         this._markers.set(tileKey, markers);
    //         const _lastVisibleTiles = this._lastVisibleTiles();
    //         if (_lastVisibleTiles) {
    //           this._showCachedSpotsAndMarkersForTiles(_lastVisibleTiles);
    //         }
    //       })
    //       .catch((err) => console.error(err));
    //   }
    // });
  }

  /*
   * From the visible tiles given and the information on which tiles are cached
   * and which are already loading, this function returns the tiles that need to
   * be loaded from the visible tiles.
   * @param visibleTiles
   */
  _getSpotTilesToLoad(
    visibleTilesObj: TilesObject,
    markAsLoading: boolean = true
  ): Set<MapTileKey> {
    let zoom = visibleTilesObj.zoom;

    if (zoom % this.divisor !== 0) {
      console.warn(
        "Zoom level is not divisible by " +
          this.divisor +
          ", returning no bounds to load for this zoom level."
      );
      return new Set();
    }

    const missingTiles = [...visibleTilesObj.tiles]
      .map((tile) => getClusterTileKey(visibleTilesObj.zoom, tile.x, tile.y))
      .filter((tileKey) => !this._spotClusterTiles.has(tileKey));

    const tilesToLoad = new Set(
      missingTiles.filter((tileKey: MapTileKey) => !this.isTileLoading(tileKey))
    );

    if (markAsLoading) {
      this.markTilesAsLoading(tilesToLoad);
    }

    return tilesToLoad;
  }

  getAllLoadedSpots(): Spot[] {
    const allSpots: Spot[] = [];
    for (const key of this._spots.keys()) {
      if (!key.includes("z16")) continue;

      const loadedSpots = this._spots.get(key);
      if (!loadedSpots) continue;

      allSpots.concat(loadedSpots);
    }

    return allSpots;
  }

  private _loadSpotClustersForTiles(tilesToLoad: Set<MapTileKey>) {
    if (tilesToLoad.size === 0) return;

    // add an empty array for the tiles that spot clusters will be loaded for
    tilesToLoad.forEach((key) => this._tilesLoading.add(key));

    // load the spot clusters and add them
    firstValueFrom(
      this._spotsService.getSpotClusterTiles(Array.from(tilesToLoad))
    )
      .then((spotClusters) => this._addLoadedSpotClusters(spotClusters))
      .catch((err) => console.error(err));
  }

  private _addLoadedSpots(spots: Spot[]) {
    if (!spots || spots.length === 0) {
      return;
    }

    spots.forEach((spot: Spot) => {
      if (!spot.tileCoordinates) return;

      const spotTile = spot.tileCoordinates.z16;
      const key: MapTileKey = getClusterTileKey(16, spotTile.x, spotTile.y);
      if (!this._spots.has(key)) {
        this._spots.set(key, []);
      }
      this._spots.get(key)!.push(spot);
    });

    const _lastVisibleTiles = this._lastVisibleTiles();
    if (_lastVisibleTiles) {
      this._showCachedSpotsAndMarkersForTiles(_lastVisibleTiles);
    }
  }

  private _addLoadedMarkers(markers: MarkerSchema[]) {}

  private _addLoadedSpotClusters(spotClusters: SpotClusterTileSchema[]) {
    if (!spotClusters || spotClusters.length === 0) {
      return;
    }

    spotClusters.forEach((spotCluster) => {
      const key: MapTileKey = getClusterTileKey(
        spotCluster.zoom,
        spotCluster.x,
        spotCluster.y
      );
      this._spotClusterTiles.set(key, spotCluster);
    });

    const _lastVisibleTiles = this._lastVisibleTiles();
    if (_lastVisibleTiles) {
      this._showCachedSpotClustersForTiles(_lastVisibleTiles);
    }
  }

  ////////// helpers

  private _transformTilesObjectToZoom(
    tilesObj: TilesObject,
    targetZoom: number
  ): TilesObject {
    const shift = targetZoom - tilesObj.zoom;

    const tileSw = new google.maps.Point(
      tilesObj.sw.x >> shift, // divide shift times by 2
      tilesObj.sw.y >> shift
    );
    const tileNe = new google.maps.Point(
      tilesObj.ne.x >> shift,
      tilesObj.ne.y >> shift
    );

    const tiles: { x: number; y: number }[] = [];
    tilesObj.tiles.forEach((tile) => {
      if (!tiles.includes(tile)) {
        tiles.push(tile);
      }
    });

    const newTilesObj: TilesObject = {
      zoom: targetZoom,
      sw: tileSw,
      ne: tileNe,
      tiles: tiles,
    };

    return newTilesObj;
  }

  isTileLoading(tileKey: MapTileKey): boolean {
    return this._tilesLoading.has(tileKey);
  }

  markTilesAsLoading(tileKeys: MapTileKey[] | Set<MapTileKey>) {
    tileKeys.forEach((tileKey) => {
      this._tilesLoading.add(tileKey);
    });
  }

  /////////////////////

  // insertSpotClusterTile(data: SpotClusterTileSchema) {
  //   // 1. check that the data matches the requirements
  //   const { zoom, x, y } = data;
  //   if (zoom % this.divisor !== 0) {
  //     console.warn(
  //       `Zoom level is not divisible by ${this.divisor}, skipping insertion.`
  //     );
  //     return;
  //   }

  //   // 2. make the cluster key
  //   const tileKey = getClusterTileKey(zoom, x, y);

  //   // 3. insert into all clusters
  //   // make an additional check if we are re-inserting a cluster
  //   if (this.debugMode && this._spotClusters.has(tileKey)) {
  //     console.warn(`Cluster already exists for ${tileKey}`);
  //     return;
  //   }
  //   this._spotClusters.set(tileKey, data);

  //   // 4. insert the tile key into the clusters by zoom map with the zoom level
  //   if (!this._spotClusterKeysByZoom.has(zoom)) {
  //     this._spotClusterKeysByZoom.set(zoom, new Map());
  //   }
  //   this._spotClusterKeysByZoom.get(zoom).set(`${x},${y}`, tileKey);
  // }

  // insertSpots(zoom: number, spots: Spot[]) {}

  // insertMarkers(zoom: number, markers: MarkerSchema[]) {}

  // getClustersForZoomAnCorners(
  //   zoom: number,
  //   sw: { x: number; y: number },
  //   ne: { x: number; y: number }
  // ): SpotClusterTileSchema[] {
  //   const clusters: SpotClusterTileSchema[] = [];

  //   // if the zoom is not divisible by the devisor round it down, and scale the coords
  //   const diff = zoom % this.divisor;
  //   zoom -= diff;
  //   xStart = xStart >> diff;
  //   xEnd = xEnd >> diff;
  //   yStart = yStart >> diff;
  //   yEnd = yEnd >> diff;

  //   for (let x = xStart; x <= xEnd; x++) {
  //     for (let y = yStart; y <= yEnd; y++) {
  //       const cluster = this.getCluster(zoom, x, y);

  //       if (cluster) {
  //         clusters.push(cluster);
  //       }
  //     }
  //   }

  //   return clusters;
  // }

  // getCluster(zoom: number, x: number, y: number): T | undefined {
  //   if (!this._spotClustersByZoom.has(zoom)) {
  //     return undefined;
  //   }

  //   const key = `${x},${y}`;
  //   const clusterToReturn = this._spotClustersByZoom.get(zoom).get(key);

  //   return clusterToReturn;
  // }

  // loadSpotsForTiles(tilesToLoad: Set<ClusterTileKey>) {}

  // loadNewClusterTiles(tilesToLoad: Set<ClusterTileKey>) {
  //   if (tilesToLoad.size === 0) return;

  //   firstValueFrom(
  //     this._spotsService.getSpotClusterTiles(Array.from(tilesToLoad))
  //   )
  //     .then((clusterTiles) => {
  //       if (clusterTiles.length > 0) {
  //         clusterTiles.forEach((clusterTile) => {
  //           this.cachedClusterTiles.insert(
  //             clusterTile.zoom,
  //             clusterTile.x,
  //             clusterTile.y,
  //             clusterTile
  //           );
  //         });

  //         this.updateVisibleDotsAndHighlightedSpots();
  //         if (this.mapZoom === 16) this.updateVisibleSpotsAndMarkers();
  //       }
  //     })
  //     .catch((err) => console.error(err));
  // }

  // getReferenceToLoadedSpotById(spotId: string): LoadedSpotReference | null {
  //   const allSpots = this.getAllLoadedSpots();

  //   // find the spot with no id
  //   const spot: Spot | undefined = allSpots.find((spot) => {
  //     return spot.id === spotId;
  //   });

  //   if (spot) {
  //     const tile = spot?.tileCoordinates?.z16!;

  //     const indexInTileArray = this.loadedSpots
  //       .get(getClusterTileKey(16, tile.x, tile.y))
  //       ?.indexOf(spot)!;

  //     const loadedSpotRef: LoadedSpotReference = {
  //       spot: spot,
  //       tile: tile,
  //       indexInTileArray: indexInTileArray,
  //       indexInTotalArray: spot ? allSpots.indexOf(spot) : -1,
  //     };

  //     return loadedSpotRef;
  //   } else {
  //     return null;
  //   }
  // }

  // /**
  //  * Add a newly created spot (before first save) to the loaded spots for nice display. It can be identified by having its ID set to empty string
  //  * @param newSpot The newly created spot class.
  //  */
  // addOrUpdateNewSpotToLoadedSpotsAndUpdate(newSpot: Spot) {
  //   if (!newSpot.id) {
  //     throw new Error(
  //       "The spot has no ID. It needs to be saved before it can be added to the loaded spots."
  //     );
  //   }

  //   //Get the tile coordinates to save in loaded spots
  //   const ref = this.getReferenceToLoadedSpotById(newSpot.id);
  //   console.log("spot to update ref", ref);
  //   if (ref?.spot && ref.indexInTileArray >= 0 && ref.tile) {
  //     // The spot exists and should be updated
  //     // Update the spot
  //     this.loadedSpots.get(getClusterTileKey(16, ref.tile.x, ref.tile.y))![
  //       ref.indexInTileArray
  //     ] = newSpot;
  //   } else {
  //     // the spot does not exist

  //     // get the tile coordinates for the location of the new spot
  //     let tile = MapHelpers.getTileCoordinatesForLocationAndZoom(
  //       newSpot.location(),
  //       16
  //     );
  //     let spots = this.loadedSpots.get(getClusterTileKey(16, tile.x, tile.y));

  //     if (spots && spots.length > 0) {
  //       // There are spots loaded for this 16 tile, add the new spot to the loaded spots array
  //       spots.push(newSpot);
  //     } else {
  //       // There are no spots loaded for this 16 tile, add it to the loaded spots
  //       spots = [newSpot];
  //     }
  //     this.loadedSpots.set(getClusterTileKey(16, tile.x, tile.y), spots);
  //   }
  //   // update the map to show the new spot on the loaded spots array.
  //   this.updateVisibleSpotsAndMarkers();
  // }

  // /**
  //  * This function is used if the new spot was saved and now has an id. It replaces the first spot it finds with no ID with the newSaveSpot
  //  * @param newSavedSpot The new spot that replaces the unsaved new spot
  //  */
  // updateNewSpotIdOnLoadedSpotsAndUpdate(newSavedSpot: Spot) {
  //   if (newSavedSpot.id) {
  //     // TODO
  //   } else {
  //     console.error(
  //       "The newly saved spot doesn't have an ID attached to it. Something is wrong"
  //     );
  //   }
  // }
}
