import { DocumentReference, Timestamp } from "firebase/firestore";
import { humanTimeSince } from "../scripts/Helpers";

export namespace User {
  export class Class {
    public uid: string = "";
    public displayName: string = "";
    public biography: string = "";
    public profilePicture: string = "";
    public startTimeDiffString: string = "";
    public startDate: Date;
    public followerCount: number = 0;
    public settings: UserSettingsSchema;

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
      this.biography = this._data.biography;
      this.profilePicture = this._data.profile_picture;
      this.settings = this._data.settings;

      // Start date
      this.startTimeDiffString = humanTimeSince(this._data.start_date.toDate());

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
    biography?: string;
    profile_picture?: string;
    follower_count?: number;
    start_date?: firebase.default.firestore.Timestamp;
    nationality?: string;
    verified_email?: boolean;
    invite_code?: string;
    settings?: UserSettingsSchema;

    creationDate?: firebase.default.firestore.Timestamp;
  }

  export interface UserSettingsSchema {
    maps?: "googlemaps" | "applemaps" | "openstreetmap";
    useGeoURI?: boolean;
  }

  export interface ReferenceSchema {
    uid: string;
    display_name?: string;
    profile_picture?: string;
    ref?: DocumentReference;
  }

  export interface FollowingDataSchema {
    // UID is not needed as it is the identifier of the following
    display_name?: string;
    profile_picture?: string;

    start_following?: Timestamp;
  }

  export interface FollowingSchema extends FollowingDataSchema {
    uid: string;
  }
}
