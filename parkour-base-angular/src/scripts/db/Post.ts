import { User } from "./User";
import { DbDate } from "./Interfaces";

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

    get imageSrc() {
      return this._data.image_src;
    }

    get likes(): number {
      return this._data.likes;
    }
    set likes(likes: number) {
      this._data.likes = likes;
    }

    get timePosted(): Date {
      return new Date(this._data.time_posted.seconds * 1000);
    }
  }

  export interface Schema {
    title: string;
    user: User.ReferenceSchema;
    body: string;
    image_src: string;

    likes: number;

    time_posted: DbDate; // seconds
  }
}
