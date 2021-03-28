import { resolve } from "@angular/compiler-cli/src/ngtsc/file_system";
import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { rejects } from "assert";
import * as firebase from "firebase/app";
import { Observable } from "rxjs";
import { map, filter, tap } from "rxjs/operators";
import { DatabaseService } from "./database.service";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  constructor(
    public angularFireAuth: AngularFireAuth,
    private _databaseService: DatabaseService
  ) {
    angularFireAuth.authState.subscribe(
      this.firebaseAuthChangeListener,
      this.firebaseAuthChangeError
    );
  }

  private _currentFirebaseUser: firebase.default.User = null;
  private _currentUserData = null;

  get state$(): Observable<firebase.default.User> {
    return this.angularFireAuth.authState;
  }

  get user() {
    return this._currentFirebaseUser;
  }

  get uid() {
    if (!this._currentFirebaseUser) {
      return "";
    }

    return this._currentFirebaseUser.uid;
  }

  get uid$() {
    return this.state$.pipe(
      //filter((fireUser) => fireUser.uid !== this.uid),
      map((user) => {
        return user?.uid;
      })
    );
  }

  get userProfilePic() {
    if (!this._currentFirebaseUser) {
      return "";
    }

    return this._currentFirebaseUser.photoURL;
  }

  firebaseAuthChangeListener = (user: firebase.default.User) => {
    if (user) {
      this._currentFirebaseUser = user;
    } else {
      this._currentFirebaseUser = null;
    }
  };

  firebaseAuthChangeError = (error: any) => {
    console.error(error);
  };

  isSignedIn(): boolean {
    if (this._currentFirebaseUser) {
      return true;
    }
    return false;
  }

  signInEmailPassword(email, password) {
    return new Promise<firebase.default.auth.UserCredential>(
      (resolve, reject) => {
        this.angularFireAuth.signInWithEmailAndPassword(email, password).then(
          (res) => resolve(res),
          (err) => reject(err)
        );
      }
    );
  }

  signInGoogle() {
    return new Promise<any>((resolve, reject) => {
      let provider = new firebase.default.auth.GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      this.angularFireAuth.signInWithPopup(provider).then(
        (res) => {
          resolve(res);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  logUserOut(callback: () => void) {
    this.angularFireAuth.signOut();
  }

  createAccount(email, password, displayName) {
    return new Promise<firebase.default.auth.UserCredential>(
      (resolve, reject) => {
        this.angularFireAuth
          .createUserWithEmailAndPassword(email, password)
          .then(
            (res) => {
              // Set the user chose Display name
              res.user.updateProfile({
                displayName: displayName,
              });

              // create a database entry for the user
              this._databaseService.addUser(res.user.uid, displayName);

              resolve(res);
            },
            (err) => reject(err)
          );
      }
    );
  }
}
