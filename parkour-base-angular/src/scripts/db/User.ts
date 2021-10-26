import * as firebase from "firebase/app";
import * as moment from "moment";

export module User {
  export class Class {
    public uid: string = "";
    public displayName: string = "";
    public profilePicture: string = "";
    public biography: string = "";
    public startTimeDiffString: string = "";
    public startDate: Date;
    public followerCount: number = 0;

    public data: User.Schema = null;

    constructor(private _uid: string, private _data: User.Schema) {
      this.uid = this._uid;
      this._updateData();
    }

    public setUserData(data: User.Schema) {
      this._data = data;
      this._updateData();
    }

    public setProfilePicture(url: string) {
      this._data.profile_picture = url;
      this._updateData();
    }

    private _updateData() {
      this.displayName = this._data.display_name;
      this.profilePicture = this._data.profile_picture;

      // Start date
      if (this._data.start_date) {
        this.startDate = this._data.start_date.toDate();
        let startMoment = moment(this._data.start_date.toDate());
        let yearsNumber: number = moment().diff(startMoment, "years");

        if (yearsNumber === 1) {
          this.startTimeDiffString = yearsNumber + " year";
        } else {
          this.startTimeDiffString = yearsNumber + " years";
        }
      }

      // Followers
      if (this._data.follower_count) {
        this.followerCount = this._data.follower_count;
      }

      // Data
      this.data = this._data;
    }
  }

  export interface Schema {
    display_name?: string;
    profile_picture?: string;
    follower_count?: number;
    start_date?: firebase.default.firestore.Timestamp;
    nationality?: string;
    verified_email?: boolean;
    invite_code?: string;

    creationDate?: firebase.default.firestore.Timestamp;
  }

  export interface ReferenceSchema {
    uid?: string;
    display_name?: string;
    profile_picture?: string;
    ref?: firebase.default.firestore.DocumentReference;
  }

  export interface FollowingDataSchema {
    // UID is not needed as it is the identifier of the following
    display_name?: string;
    profile_picture?: string;

    start_following?: firebase.default.firestore.Timestamp;
  }

  export interface FollowingSchema extends FollowingDataSchema {
    uid: string;
  }
}
