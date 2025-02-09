import { Injectable } from "@angular/core";
import {
  Firestore,
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
} from "@angular/fire/firestore";
import { SpotReview } from "../../../../scripts/db/SpotReview";

declare function plausible(eventName: string, options?: { props: any }): void;

@Injectable({
  providedIn: "root",
})
export class SpotReviewsService {
  constructor(private firestore: Firestore) {}

  getSpotReviewById(spotId: string, reviewId: string): Promise<SpotReview> {
    return getDoc(
      doc(this.firestore, "spots", spotId, "reviews", reviewId)
    ).then((snap) => {
      if (!snap.exists()) {
        return Promise.reject("No review found for this review id.");
      }
      return snap.data() as SpotReview;
    });
  }

  getSpotReviewsBySpotId(spotId: string): Promise<SpotReview[]> {
    return getDocs(
      query(collection(this.firestore, "spots", spotId, "reviews"))
    ).then((snap) => {
      if (snap.size == 0) {
        return [];
      }
      return snap.docs.map((data) => data.data() as SpotReview);
    });
  }

  getSpotReviewsByUserId(userId: string): Promise<SpotReview> {
    return getDocs(
      query(
        collection(this.firestore, "reviews"),
        where("userId", "==", userId)
      )
    ).then((snap) => {
      if (snap.size == 0) {
        return Promise.reject("No reviews found for this user id.");
      }
      return snap.docs[0].data() as SpotReview;
    });
  }

  updateSpotReview(review: SpotReview) {
    const spot_id: string = review.spot.id;
    const user_id: string = review.user.uid;

    if (typeof plausible !== "undefined") {
      plausible("Add/update Spot Review", {
        props: { spotId: spot_id },
      });
    }

    return setDoc(
      doc(this.firestore, "spots", spot_id, "reviews", user_id),
      review
    );
  }
}
