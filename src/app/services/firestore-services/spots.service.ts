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
import { Spot, SpotId } from "../../../db/models/Spot";
import {
  ClusterTileKey,
  getDataFromClusterTileKey,
  SpotClusterTile,
} from "../../../db/models/SpotClusterTile";

@Injectable({
  providedIn: "root",
})
export class SpotsService {
  constructor(private firestore: Firestore) {}

  docRef(path: string) {
    return doc(this.firestore, path);
  }

  getSpotById(spotId: SpotId): Observable<Spot.Spot> {
    return new Observable<Spot.Spot>((observer) => {
      return onSnapshot(
        doc(this.firestore, "spots", spotId),
        (snap) => {
          if (snap.exists) {
            const data = snap.data() as Spot.SpotSchema;
            let spot = new Spot.Spot(snap.id as SpotId, data);
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

  getSpotsForTileKeys(tileKeys: ClusterTileKey[]): Observable<Spot.Spot[]> {
    const tiles = tileKeys.map((key) => getDataFromClusterTileKey(key));
    return this.getSpotsForTiles(tiles);
  }

  getSpotsForTiles(tiles: { x: number; y: number }[]): Observable<Spot.Spot[]> {
    const observables = tiles.map((tile) => {
      return new Observable<Spot.Spot[]>((observer) => {
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
      map((arrays: Spot.Spot[][]) => {
        let allSpots = new Map<string, Spot.Spot>();
        arrays.forEach((spots: Spot.Spot[]) => {
          spots.forEach((spot: Spot.Spot) => {
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

  private _parseSpots(snapshot: QuerySnapshot<DocumentData>): Spot.Spot[] {
    let newSpots: Spot.Spot[] = [];
    snapshot.forEach((doc) => {
      const data: any = doc.data();
      const spotData: Spot.SpotSchema = data as Spot.SpotSchema;
      if (spotData) {
        let newSpot: Spot.Spot = new Spot.Spot(doc.id as SpotId, spotData);
        newSpots.push(newSpot);
      } else {
        console.error("Spot could not be cast to Spot.Schema!");
      }
    });
    return newSpots;
  }

  createSpot(spotData: Spot.SpotSchema): Promise<SpotId> {
    return addDoc(collection(this.firestore, "spots"), spotData).then(
      (data) => {
        return data.id as SpotId;
      }
    );
  }

  updateSpot(
    spotId: SpotId,
    spotUpdateData: Partial<Spot.SpotSchema>
  ): Promise<void> {
    return updateDoc(doc(this.firestore, "spots", spotId), spotUpdateData);
  }

  createMultipleSpots(spotData: Spot.SpotSchema[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    spotData.forEach((spot) => {
      const newSpotRef = doc(collection(this.firestore, "spots"));
      batch.set(newSpotRef, spot);
    });
    return batch.commit();
  }
}
