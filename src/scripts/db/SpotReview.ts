import { User } from "./User";

export interface SpotReview {
  spot_id: string;
  user: User.ReferenceSchema;
  rating: number; // number between 1 and 10
  comment?: string;
  created_at: FirebaseFirestore.Timestamp;
}
