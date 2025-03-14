import { DocumentReference, Timestamp } from "@firebase/firestore";
import { humanTimeSince } from "../../scripts/Helpers";
import { SizedStorageSrc } from "./Interfaces";

export namespace User {
  export class Class {
    public uid: string;
    public displayName: string = "";
    public biography: string = "";
    public profilePicture: SizedStorageSrc | null = null;
    public startTimeDiffString: string | null = null;
    public startDate: Date | null = null;
    public followerCount: number = 0;
    public settings: UserSettingsSchema | null = null;

    public data: User.Schema | null = null;

    constructor(private _uid: string, private _data: User.Schema) {
      this.uid = this._uid;
      this._updateData();
    }

    public setUserData(data: User.Schema) {
      this._data = data;
      this._updateData();
    }

    public setProfilePicture(url: SizedStorageSrc) {
      this._data.profile_picture = url;
      this._updateData();
    }

    private _updateData() {
      this.displayName = this._data.display_name ?? "";
      this.biography = this._data.biography ?? "";
      this.profilePicture =
        (this._data.profile_picture as SizedStorageSrc) ??
        ("" as SizedStorageSrc);
      this.settings = this._data.settings ?? {};

      // Start date
      if (this._data.start_date) {
        this.startTimeDiffString = humanTimeSince(
          this._data.start_date.toDate()
        );
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
    biography?: string;
    profile_picture?: string;
    follower_count?: number;
    start_date?: Timestamp;
    nationality?: string;
    verified_email?: boolean;
    invite_code?: string;
    settings?: UserSettingsSchema;

    creationDate?: Timestamp;
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
