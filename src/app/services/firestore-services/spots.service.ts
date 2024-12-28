import { Injectable } from "@angular/core";
import {
  Firestore,
  doc,
  addDoc,
  collection,
  onSnapshot,
  where,
  query,
  updateDoc,
  writeBatch,
  QuerySnapshot,
  DocumentData,
} from "@angular/fire/firestore";
import { Observable, forkJoin } from "rxjs";
import { map, take } from "rxjs/operators";
import { Spot, SpotId } from "../../../scripts/db/Spot";
import {
  ClusterTileKey,
  getDataFromClusterTileKey,
  SpotClusterTile,
} from "../../../scripts/db/SpotClusterTile";

@Injectable({
  providedIn: "root",
})
export class SpotsService {
  constructor(private firestore: Firestore) {}

  docRef(path: string) {
    return doc(this.firestore, path);
  }

  getSpotById(spotId: SpotId): Observable<Spot.Class> {
    return new Observable<Spot.Class>((observer) => {
      return onSnapshot(
        doc(this.firestore, "spots", spotId),
        (snap) => {
          if (snap.exists) {
            const data = snap.data() as Spot.Schema;
            let spot = new Spot.Class(snap.id as SpotId, data);
            observer.next(spot);
          } else {
            observer.error({ msg: "Error! This Spot does not exist." });
          }
        },
        (error) => {
          observer.error({
            msg: "Error! There was a problem loading this spot.",
            debug: error,
          });
        }
      );
    });
  }

  getSpotsForTileKeys(tileKeys: ClusterTileKey[]): Observable<Spot.Class[]> {
    const tiles = tileKeys.map((key) => getDataFromClusterTileKey(key));
    return this.getSpotsForTiles(tiles);
  }

  getSpotsForTiles(
    tiles: { x: number; y: number }[]
  ): Observable<Spot.Class[]> {
    const observables = tiles.map((tile) => {
      return new Observable<Spot.Class[]>((observer) => {
        const unsubscribe = onSnapshot(
          query(
            collection(this.firestore, "spots"),
            where("tile_coordinates.z16.x", "==", tile.x),
            where("tile_coordinates.z16.y", "==", tile.y)
          ),
          (snap) => {
            observer.next(this._parseSpots(snap));
          },
          (error) => {
            observer.error(error);
          }
        );
        return () => {
          unsubscribe();
        };
      }).pipe(take(1));
    });

    return forkJoin(observables).pipe(
      map((arrays: Spot.Class[][]) => {
        let allSpots = new Map<string, Spot.Class>();
        arrays.forEach((spots: Spot.Class[]) => {
          spots.forEach((spot: Spot.Class) => {
            allSpots.set(spot.id, spot);
          });
        });
        return Array.from(allSpots.values());
      })
    );
  }

  getSpotClusterTiles(tiles: ClusterTileKey[]): Observable<SpotClusterTile[]> {
    const observables = tiles.map((tile) => {
      return new Observable<SpotClusterTile[]>((observer) => {
        const unsubscribe = onSnapshot(
          doc(this.firestore, "spot_clusters", tile),
          (snap) => {
            if (snap.exists()) {
              observer.next([snap.data() as SpotClusterTile]);
            } else {
              observer.next([]);
            }
          },
          (error) => {
            console.error(error);
            observer.error(error);
          }
        );
        return () => {
          unsubscribe();
        };
      }).pipe(take(1));
    });

    return forkJoin(observables).pipe(
      map((arrays: SpotClusterTile[][]) => {
        let allTiles = new Array<SpotClusterTile>();
        arrays.forEach((tiles: SpotClusterTile[]) => {
          tiles.forEach((tile: SpotClusterTile) => {
            allTiles.push(tile);
          });
        });
        return allTiles;
      })
    );
  }

  private _parseSpots(snapshot: QuerySnapshot<DocumentData>): Spot.Class[] {
    let newSpots: Spot.Class[] = [];
    snapshot.forEach((doc) => {
      const data: any = doc.data();
      const spotData: Spot.Schema = data as Spot.Schema;
      if (spotData) {
        let newSpot: Spot.Class = new Spot.Class(doc.id as SpotId, spotData);
        newSpots.push(newSpot);
      } else {
        console.error("Spot could not be cast to Spot.Schema!");
      }
    });
    return newSpots;
  }

  createSpot(spotData: Spot.Schema): Promise<SpotId> {
    return addDoc(collection(this.firestore, "spots"), spotData).then(
      (data) => {
        return data.id as SpotId;
      }
    );
  }

  updateSpot(
    spotId: SpotId,
    spotUpdateData: Partial<Spot.Schema>
  ): Promise<void> {
    return updateDoc(doc(this.firestore, "spots", spotId), spotUpdateData);
  }

  createMultipleSpots(spotData: Spot.Schema[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    spotData.forEach((spot) => {
      const newSpotRef = doc(collection(this.firestore, "spots"));
      batch.set(newSpotRef, spot);
    });
    return batch.commit();
  }
}
