import * as firebase from "firebase/compat/app";

export module Like {
  export class Class {}

  export interface Schema {
    time: firebase.default.firestore.Timestamp;
    user: {
      uid: string;
    };
  }
}
