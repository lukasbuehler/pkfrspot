import * as firebase from "firebase/app";
import * as moment from "moment";

export module User {
  export class Class {
    constructor(private _uid: string, private _data: User.Schema) {}

    uid(): string {
      return this._uid;
    }

    get displayName() {
      return this._data.display_name;
    }

    get profilePicture() {
      return this._data.profile_picture;
    }

    get startTimeAgoString() {
      if (this._data.start_date) {
        return moment(this._data.start_date).fromNow();
      }
      return "";
    }

    get followerCount() {
      // TODO
      return 0;
    }
  }

  export interface Schema {
    display_name: string;
    profile_picture?: string;
    //full_name?: string;
    start_date?: firebase.default.firestore.Timestamp;
    nationality?: string;
    verified_email: boolean;

    creationDate: firebase.default.firestore.Timestamp;
  }

  export interface ReferenceSchema {
    uid: string;
    display_name: string;
    profile_picture?: string;
    ref: firebase.default.firestore.DocumentReference;
  }
}
