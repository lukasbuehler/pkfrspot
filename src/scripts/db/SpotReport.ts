import { User } from "./User";

interface SpotData {
  name: string; // english name
  id: string;
}

export enum SpotReportReason {
  Duplicate = "duplicate",
}

export interface SpotReport {
  spot: SpotData;
  reason: SpotReportReason | string;
  duplicateOf?: SpotData;
  user: User.ReferenceSchema;
}
