import { Injectable } from "@angular/core";
import {
  Firestore,
  doc,
  addDoc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  collectionGroup,
} from "@angular/fire/firestore";
import { SpotReportSchema } from "../../../../db/schemas/SpotReportSchema";

declare function plausible(eventName: string, options?: { props: any }): void;

@Injectable({
  providedIn: "root",
})
export class SpotReportsService {
  constructor(private firestore: Firestore) {}

  getSpotReportById(
    spotId: string,
    reportId: string
  ): Promise<SpotReportSchema> {
    return getDoc(
      doc(this.firestore, "spots", spotId, "reports", reportId)
    ).then((snap) => {
      if (!snap.exists()) {
        return Promise.reject("No report found for this report id.");
      }
      return snap.data() as SpotReportSchema;
    });
  }

  getSpotReportsBySpotId(spotId: string): Promise<SpotReportSchema[]> {
    console.log("getting all reports for a spot");
    return getDocs(
      query(collection(this.firestore, "spots", spotId, "reports"))
    ).then((snap) => {
      if (snap.size == 0) {
        return [];
      }
      return snap.docs.map((data) => data.data() as SpotReportSchema);
    });
  }

  getSpotReportsByUserId(userId: string): Promise<SpotReportSchema> {
    console.log("getting all reports for a user");
    return getDocs(
      query(
        collectionGroup(this.firestore, "reports"),
        where("userId", "==", userId)
      )
    ).then((snap) => {
      if (snap.size == 0) {
        return Promise.reject("No reports found for this user id.");
      }
      return snap.docs[0].data() as SpotReportSchema;
    });
  }

  addSpotReport(report: SpotReportSchema) {
    const spot_id: string = report.spot.id;

    if (typeof plausible !== "undefined") {
      plausible("Add Spot Report", {
        props: { spotId: spot_id },
      });
    }

    return addDoc(
      collection(this.firestore, "spots", spot_id, "reports"),
      report
    );
  }
}
