import { Injectable } from "@angular/core";
import {
  Firestore,
  doc,
  addDoc,
  getDoc,
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
import { Spot, SpotId } from "../../../../db/models/Spot";
import {
  MapTileKey,
  getDataFromClusterTileKey,
  SpotClusterTileSchema,
} from "../../../../db/schemas/SpotClusterTile";
import { SpotSchema } from "../../../../db/schemas/SpotSchema";
import { LocaleCode } from "../../../../db/models/Interfaces";
import { transformFirestoreData } from "../../../../scripts/Helpers";
import { GeoPoint } from "@firebase/firestore";
import { StorageService } from "../storage.service";

@Injectable({
  providedIn: "root",
})
export class SpotsService {
  constructor(
    private firestore: Firestore,
    private storageService: StorageService
  ) {}

  docRef(path: string) {
    return doc(this.firestore, path);
  }

  getSpotById(spotId: SpotId, locale: LocaleCode): Promise<Spot> {
    return getDoc(doc(this.firestore, "spots", spotId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as SpotSchema;
        return new Spot(snap.id as SpotId, data, locale);
      } else {
        throw new Error("Error! This Spot does not exist.");
      }
    });
  }

  getSpotByIdHttp(spotId: SpotId, locale: LocaleCode): Promise<Spot> {
    return fetch(
      `https://firestore.googleapis.com/v1/projects/parkour-base-project/databases/(default)/documents/spots/${spotId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (!data.fields) {
          throw new Error("No 'fields' property in JSON response");
        }

        const spotData = transformFirestoreData(data.fields) as SpotSchema;

        return new Spot(spotId, spotData, locale);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
        throw error;
      });
  }

  getSpotById$(spotId: SpotId, locale: LocaleCode): Observable<Spot> {
    console.debug("Getting spot with id: ", spotId);

    return new Observable<Spot>((observer) => {
      return onSnapshot(
        doc(this.firestore, "spots", spotId),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as SpotSchema;
            let spot = new Spot(snap.id as SpotId, data, locale);
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

  getSpotsForTileKeys(
    tileKeys: MapTileKey[],
    locale: LocaleCode
  ): Observable<Spot[]> {
    const tiles = tileKeys.map((key) => getDataFromClusterTileKey(key));
    return this.getSpotsForTiles(tiles, locale);
  }

  getSpotsForTiles(
    tiles: { x: number; y: number }[],
    locale: LocaleCode
  ): Observable<Spot[]> {
    const observables = tiles.map((tile) => {
      console.debug("Getting spots for tile: ", tile);

      return new Observable<Spot[]>((observer) => {
        const unsubscribe = onSnapshot(
          query(
            collection(this.firestore, "spots"),
            where("tile_coordinates.z16.x", "==", tile.x),
            where("tile_coordinates.z16.y", "==", tile.y)
          ),
          (snap) => {
            observer.next(this._parseSpots(snap, locale));
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
      map((arrays: Spot[][]) => {
        let allSpots = new Map<string, Spot>();
        arrays.forEach((spots: Spot[]) => {
          spots.forEach((spot: Spot) => {
            allSpots.set(spot.id, spot);
          });
        });
        return Array.from(allSpots.values());
      })
    );
  }

  getSpotClusterTiles(
    tiles: MapTileKey[]
  ): Observable<SpotClusterTileSchema[]> {
    const observables = tiles.map((tile) => {
      console.debug("Getting spot cluster tile: ", tile);

      return new Observable<SpotClusterTileSchema[]>((observer) => {
        const unsubscribe = onSnapshot(
          doc(this.firestore, "spot_clusters", tile),
          (snap) => {
            if (snap.exists()) {
              observer.next([snap.data() as SpotClusterTileSchema]);
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
      map((arrays: SpotClusterTileSchema[][]) => {
        let allTiles = new Array<SpotClusterTileSchema>();
        arrays.forEach((tiles: SpotClusterTileSchema[]) => {
          tiles.forEach((tile: SpotClusterTileSchema) => {
            allTiles.push(tile);
          });
        });
        return allTiles;
      })
    );
  }

  private _parseSpots(
    snapshot: QuerySnapshot<DocumentData>,
    locale: LocaleCode
  ): Spot[] {
    let newSpots: Spot[] = [];
    snapshot.forEach((doc) => {
      const data: any = doc.data();
      const spotData: SpotSchema = data as SpotSchema;
      if (spotData) {
        let newSpot: Spot = new Spot(doc.id as SpotId, spotData, locale);
        newSpots.push(newSpot);
      } else {
        console.error("Spot could not be cast to Spot.Schema!");
      }
    });
    return newSpots;
  }

  createSpot(spotData: SpotSchema): Promise<SpotId> {
    return addDoc(collection(this.firestore, "spots"), spotData).then(
      (data) => {
        return data.id as SpotId;
      }
    );
  }

  updateSpot(
    spotId: SpotId,
    spotUpdateData: Partial<SpotSchema>,
    oldSpotData?: Partial<SpotSchema>
  ): Promise<void> {
    // remove the reviews, review_histogram and review_count fields
    const fieldsToRemove: (keyof SpotSchema)[] = [
      "rating",
      "num_reviews",
      "rating_histogram",
      "highlighted_reviews",
    ];

    for (let field of fieldsToRemove) {
      if (field in spotUpdateData) {
        delete spotUpdateData[field];
      }
    }

    // check if the media has changed and delete the old media from storage
    let oldSpotMediaPromise: Promise<SpotSchema["media"]>;
    if (oldSpotData && oldSpotData.media) {
      oldSpotMediaPromise = Promise.resolve(oldSpotData.media);
    } else {
      oldSpotMediaPromise = this.getSpotById(spotId, "en").then((spot) => {
        return spot.media();
      });
    }

    oldSpotMediaPromise.then((oldSpotMedia) => {
      this._checkMediaDiffAndDeleteFromStorageIfNecessary(
        oldSpotMedia,
        spotUpdateData.media
      );
    });

    console.log("Updating spot with data: ", JSON.stringify(spotUpdateData));
    return updateDoc(doc(this.firestore, "spots", spotId), spotUpdateData);
  }

  updateSpotMedia(spotId: SpotId, media: SpotSchema["media"]) {
    return updateDoc(doc(this.firestore, "spots", spotId), { media });
  }

  _checkMediaDiffAndDeleteFromStorageIfNecessary(
    oldMedia: SpotSchema["media"],
    newMedia: SpotSchema["media"]
  ) {
    console.log("oldSpotMedia", oldMedia);
    console.log("newSpotMedia", newMedia);

    oldMedia?.forEach((oldMediaItem) => {
      if (
        !newMedia ||
        !newMedia.find((newMediaItem) => newMediaItem.src === oldMediaItem.src)
      ) {
        let filenameRegex = RegExp(
          /(?:spot_pictures)(?:\/|%2F)(.+?)(?:\?.*)?$/
        );
        let storageFilenameMatch = oldMediaItem.src.match(filenameRegex);
        if (storageFilenameMatch && storageFilenameMatch[1]) {
          let storageFilename = storageFilenameMatch[1] || "";
          // delete oldMediaItem from storage
          console.log("Deleting media item: ", oldMediaItem);
          this.storageService.deleteSpotImageFromStorage(storageFilename);
        }
      }
    });
  }

  createMultipleSpots(spotData: SpotSchema[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    spotData.forEach((spot) => {
      const newSpotRef = doc(collection(this.firestore, "spots"));
      batch.set(newSpotRef, spot);
    });
    return batch.commit();
  }
}
