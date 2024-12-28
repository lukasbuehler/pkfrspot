import { Injectable } from "@angular/core";
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "@angular/fire/firestore";
import { SpotSlug } from "../../../scripts/db/Interfaces";
import { SpotId } from "../../../scripts/db/Spot";

@Injectable({
  providedIn: "root",
})
export class SlugsService {
  constructor(private firestore: Firestore) {}

  addSpotSlug(spotId: string, slug: string): Promise<void> {
    // validate that the slug only contains alphanumeric characters and hyphens
    if (!slug.match(/^[a-z0-9-]+$/))
      return Promise.reject(
        "The slug must only contain lowercase alphanumeric characters and hyphens."
      );

    const data: SpotSlug = {
      spotId: spotId,
    };

    return setDoc(doc(this.firestore, "spot_slugs", slug), data);
  }

  getAllSlugsForASpot(spotId: string): Promise<string[]> {
    return getDocs(
      query(
        collection(this.firestore, "spot_slugs"),
        where("spotId", "==", spotId)
      )
    ).then((snap) => {
      if (snap.size == 0) {
        return [];
      }
      return snap.docs.map((data) => data.id);
    });
  }

  getSpotIdFromSpotSlug(slug: SpotSlug): Promise<SpotId> {
    const slugString: string = slug.toString();

    return getDoc(doc(this.firestore, "spot_slugs", slugString))
      .then((snap) => {
        if (!snap.exists()) {
          return Promise.reject("No spot found for this slug.");
        }
        return snap.data() as SpotSlug;
      })
      .then((data) => data.spotId as SpotId);
  }
}
