import { SpotClusterTileSchema } from "../../db/schemas/SpotClusterTile";
import { TilesObject } from "../map/map.component";

export class MapClusterStore {
  /**
   * This class handles the storage of all the information for the spot map
   * spots and clusters.
   */
  private _clustersByZoom: Map<number, Map<string, SpotClusterTileSchema>>;
  private _debugMode = false;
  private _tilesLoading: Map<number, Map<string, boolean>>;

  constructor(debugMode: boolean = true) {
    this._clustersByZoom = new Map();
    this._tilesLoading = new Map();
  }

  insert(zoom: number, x: number, y: number, cluster: SpotClusterTileSchema) {
    if (!this._clustersByZoom.has(zoom)) {
      this._clustersByZoom.set(zoom, new Map());
    }

    // make an additional check if we are re-inserting a cluster
    if (this._debugMode && this.has(zoom, x, y)) {
      console.warn(`Cluster already exists at ${zoom},${x},${y}`);
    }

    const key = `${x},${y}`;
    this._clustersByZoom.get(zoom).set(key, cluster);
  }

  getClustersForZoomAndRange(
    zoom: number,
    xStart: number,
    xEnd: number,
    yStart: number,
    yEnd: number
  ): SpotClusterTileSchema[] {
    const clusters: SpotClusterTileSchema[] = [];

    // if the zoom is not divisible by 4 round it down, and scale the coords
    const diff = zoom % 4;
    zoom -= diff;
    xStart = xStart >> diff;
    xEnd = xEnd >> diff;
    yStart = yStart >> diff;
    yEnd = yEnd >> diff;

    for (let x = xStart; x <= xEnd; x++) {
      for (let y = yStart; y <= yEnd; y++) {
        const cluster = this.getCluster(zoom, x, y);

        if (cluster) {
          clusters.push(cluster);
        }
      }
    }

    return clusters;
  }

  has(zoom: number, x: number, y: number): boolean {
    if (!this._clustersByZoom.has(zoom)) {
      return false;
    }

    const key = `${x},${y}`;
    return this._clustersByZoom.get(zoom).has(key);
  }

  isTileLoading(zoom: number, x: number, y: number): boolean {
    if (!this._tilesLoading.has(zoom)) {
      return false;
    }

    const key = `${x},${y}`;
    return this._tilesLoading.get(zoom).has(key);
  }

  markTilesAsLoading(zoom: number, tiles: { x: number; y: number }[]) {
    if (!this._tilesLoading.has(zoom)) {
      this._tilesLoading.set(zoom, new Map());
    }

    tiles.forEach((tile) => {
      const key = `${tile.x},${tile.y}`;
      this._tilesLoading.get(zoom).set(key, true);
    });
  }

  getCluster(
    zoom: number,
    x: number,
    y: number
  ): SpotClusterTileSchema | undefined {
    if (!this._clustersByZoom.has(zoom)) {
      return undefined;
    }

    const key = `${x},${y}`;
    const clusterToReturn = this._clustersByZoom.get(zoom).get(key);

    return clusterToReturn;
  }

  /**
   * From the visible tiles given and the information on which tiles are cached
   * and which are already loading, this function returns the tiles that need to
   * be loaded from the visible tiles.
   * @param visibleTiles
   */
  getTilesToLoad(
    visibleTilesObj: TilesObject,
    markAsLoading: boolean = true
  ): { zoom: number; tiles: { x: number; y: number }[] } {
    let zoom = visibleTilesObj.zoom;

    if (zoom % 4 !== 0) {
      console.warn(
        "Zoom level is not divisible by 4, returning no bounds to load for this zoom level."
      );
      return { zoom: zoom, tiles: [] };
    }

    const missingTiles = [...visibleTilesObj.tiles].filter(
      (tile) => !this.has(visibleTilesObj.zoom, tile.x, tile.y)
    );

    const tilesToLoad = missingTiles.filter(
      (tile) => !this.isTileLoading(visibleTilesObj.zoom, tile.x, tile.y)
    );

    if (markAsLoading) {
      this.markTilesAsLoading(visibleTilesObj.zoom, tilesToLoad);
    }

    const tilesToLoadObj = {
      zoom: visibleTilesObj.zoom,
      tiles: tilesToLoad,
    };

    return tilesToLoadObj;
  }
}
