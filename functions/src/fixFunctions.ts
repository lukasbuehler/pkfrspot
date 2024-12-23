import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { GeoPoint } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

/**
 * Fix all spots with the location field that is a map to be a GeoPoint again.
 */
export const fixSpotLocations = onDocumentCreated(
  { document: "spots/run-fix-locations" },
  async (event) => {
    const spots = await admin
      .firestore()
      .collection("spots")
      .where("location", "!=", null)
      .get();

    const batch = admin.firestore().batch();

    spots.docs.forEach((spot) => {
      const location = spot.data().location;
      if (
        location &&
        location.latitude !== undefined &&
        location.longitude !== undefined
      ) {
        const geoPoint = new GeoPoint(location.latitude, location.longitude);
        batch.update(spot.ref, { location: geoPoint });
        console.log("Fixed location for spot", spot.id);
      }
    });

    // commit the batch
    await batch.commit();

    // delete the run document
    return event.data?.ref.delete();
  }
);
