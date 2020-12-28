import { User } from "./User";
import * as firebase from "firebase/app";

export module Post {
  export class Class {
    constructor(private _id: string, private _data: Post.Schema) {}

    get title() {
      return this._data.title;
    }

    get user() {
      return this._data.user;
    }

    get body() {
      return this._data.body;
    }

    get id() {
      return this._id;
    }

    get mediaSrc() {
      if (this._data.media) {
        return this._data.media.src || "";
      }
      return null;
    }

    get mediaIsImage() {
      if (this._data.media) {
        return this._data.media.type === MediaTypes.Image;
      }
      return null;
    }

    get location(): google.maps.LatLngLiteral {
      if (this._data.location) {
        return {
          lat: this._data.location.latitude,
          lng: this._data.location.longitude,
        };
      }
      return null;
    }

    get spot() {
      if (this._data.spot) {
        return this._data.spot;
      }
      return null;
    }

    get likeCount(): number {
      return this._data.like_count + this._likeOffset;
    }

    private _likeOffset: number = 0;
    like(): void {
      this._likeOffset++;
    }
    unlike(): void {
      this._likeOffset--;
    }

    get timePosted(): Date {
      return new Date(this._data.time_posted.seconds * 1000);
    }

    updateData(data: Post.Schema) {
      this._data = data;
      this._likeOffset = 0;
    }
  }

  export enum MediaTypes {
    None = "none",
    Video = "video",
    Image = "image",
    YouTube = "youtube",
    Instagram = "instagram",
    Vimeo = "vimeo",
  }

  export interface Schema {
    title: string;
    user: User.ReferenceSchema;
    body: string;
    media?: {
      type: MediaTypes;
      src: string;
    };
    location?: firebase.default.firestore.GeoPoint; // where the media was taken
    spot?: {
      name: string;
      spot_location: firebase.default.firestore.GeoPoint;
      image_src: string;
      ref: firebase.default.firestore.DocumentReference;
    };

    like_count?: number;

    time_posted: firebase.default.firestore.Timestamp;
  }
}
