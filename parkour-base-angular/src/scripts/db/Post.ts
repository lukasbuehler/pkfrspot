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
        return this._data.media.is_image;
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

  export interface Schema {
    title: string;
    user: User.ReferenceSchema;
    body: string;
    media: {
      is_image: boolean;
      src: string;
    };

    like_count?: number;

    time_posted: firebase.firestore.Timestamp;
  }
}
