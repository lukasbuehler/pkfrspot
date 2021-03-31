import * as firebase from "firebase/app";
import * as moment from "moment";

export module User {
  export class Class {
    constructor(private _uid: string, private _data: User.Schema) {
      this.uid = this._uid;
      this.displayName = this._data.display_name;
      this.profilePicture = this._data.profile_picture;
      this.startTimeDiffString = moment(this._data.start_date.toDate()).fromNow(
        true
      );
    }

    public uid: string = "";
    public displayName: string = "";
    public profilePicture: string = "";
    public startTimeDiffString: string = "";
    public followerCount: number = 0;
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
