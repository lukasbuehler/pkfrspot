import { Injectable } from "@angular/core";
import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { User } from "../../../db/User";

@Injectable({
  providedIn: "root",
})
export class UsersService {
  constructor(private firestore: Firestore) {}

  addUser(
    userId: string,
    display_name: string,
    data: User.Schema
  ): Promise<void> {
    let schema: User.Schema = {
      display_name: display_name,
      verified_email: false,
      ...data,
    };
    return setDoc(doc(this.firestore, "users", userId), schema);
  }

  getUserById(userId): Observable<User.Class | null> {
    return new Observable<User.Class | null>((observer) => {
      return onSnapshot(
        doc(this.firestore, "users", userId),
        (snap) => {
          if (snap.exists()) {
            let user = new User.Class(snap.id, snap.data() as User.Schema);
            observer.next(user);
          } else {
            observer.next(null);
          }
        },
        (err) => {
          observer.error(err);
        }
      );
    });
  }

  updateUser(userId: string, _data: Partial<User.Schema>) {
    return updateDoc(doc(this.firestore, "users", userId), _data);
  }

  deleteUser() {
    // TODO
  }
}
