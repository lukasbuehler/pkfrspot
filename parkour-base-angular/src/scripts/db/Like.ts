import * as firebase from "firebase/app";

export module Like {
  export class Class {}

  export interface Schema {
    time: firebase.firestore.Timestamp;
    user: {
      uid: string;
    };
  }
}
