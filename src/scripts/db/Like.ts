import { Timestamp } from "firebase/firestore";

export namespace Like {
  export class Class {}

  export interface Schema {
    time: Timestamp;
    user: {
      uid: string;
    };
  }
}
