import { User } from "../models/User";

export interface SpotReviewSchema {
  spot: { id: string; name: string };
  user: User.ReferenceSchema;
  rating: number; // number between 1 and 10
  comment?: {
    text: string;
    locale: string;
  };
  // created_at?: FirebaseFirestore.Timestamp;
}
