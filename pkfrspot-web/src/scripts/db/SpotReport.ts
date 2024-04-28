import { Spot } from "./Spot.js";

interface SpotData {
  name: string; // english name
  id: string;
}

enum SpotReportReason {
  Duplicate = "duplicate",
}

export interface SpotReport {
  spotId: string;
  reason: SpotReportReason | string;
  duplicateOf?: SpotData;
  userId: string;
}
