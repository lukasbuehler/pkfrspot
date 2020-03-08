import { DbDate } from "./Interfaces";

export module User {
  export interface Schema {
    name: string;
    nickname: string;
    birthday: DbDate;
    nation: string;
  }

  export interface ReferenceSchema {
    id: string;
    name: string;
    ref: string;
  }
}
