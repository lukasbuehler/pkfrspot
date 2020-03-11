import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import * as firebase from "firebase/app";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class AuthenticationService {
  constructor(public angularFireAuth: AngularFireAuth) {
    angularFireAuth.authState.subscribe(
      this.firebaseAuthChangeListener,
      this.firebaseAuthChangeError
    );
  }

  private _currentUser: firebase.User = null;

  get state$(): Observable<firebase.User> {
    return this.angularFireAuth.authState;
  }

  get user() {
    return this._currentUser;
  }

  get uid() {
    return this._currentUser.uid;
  }

  get userProfilePic() {
    return this._currentUser.photoURL;
  }

  firebaseAuthChangeListener = (user: firebase.User) => {
    if (user) {
      this._currentUser = user;
    } else {
      this._currentUser = null;
    }
  };

  firebaseAuthChangeError = (error: any) => {
    console.error(error);
  };

  isSignedIn(): boolean {
    if (this._currentUser) {
      return true;
    }
    return false;
  }

  logUserOut(callback: () => void) {
    this.angularFireAuth.auth.signOut();
  }
}
