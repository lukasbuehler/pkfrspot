import { resolve } from "@angular/compiler-cli/src/ngtsc/file_system";
import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { rejects } from "assert";
import * as firebase from "firebase/app";
import { Observable, Subject } from "rxjs";
import { map, filter, tap } from "rxjs/operators";
import { User } from "src/scripts/db/User";
import { DatabaseService } from "./database.service";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  // Public properties
  public isSignedIn: boolean = false;
  public uid: string = "";
  public email: string = "";
  public emailVerified: boolean = false;

  /**
   * The user from the database corresponding to the currently authenticated user
   */
  public user: User.Class = null;
  public userProfilePic: string = "";

  public authState$: Subject<User.Class> = new Subject();

  constructor(
    public angularFireAuth: AngularFireAuth,
    private _databaseService: DatabaseService
  ) {
    this.angularFireAuth.authState.subscribe(
      this.firebaseAuthChangeListener,
      this.firebaseAuthChangeError
    );
  }

  private _currentFirebaseUser: firebase.default.User = null;

  private firebaseAuthChangeListener = (
    firebaseUser: firebase.default.User
  ) => {
    // Auth state changed
    if (firebaseUser) {
      // If we have a firebase user, we are signed in.
      this._currentFirebaseUser = firebaseUser;
      this.isSignedIn = true;
      this.uid = firebaseUser.uid;
      this.email = firebaseUser.email;
      this.emailVerified = firebaseUser.emailVerified;

      this._databaseService.getUserById(firebaseUser.uid).subscribe(
        (_user) => {
          this.user = _user;
          this.userProfilePic = _user.profilePicture;

          this.authState$.next(_user);

          // TODO This is not so nice
          if (!_user.profilePicture && firebaseUser.photoURL) {
            // There is no profile picture in the database, use the photo from the firebase user and save it in the database.
            _user.setProfilePicture(firebaseUser.photoURL);
            this._databaseService
              .updateUser(_user.uid, _user.data)
              .then(() => {
                // Successfully updated the user data with the new profile picture
              })
              .catch((err) => {
                // There was an error updating the profile picture
              });
          }
        },
        (err) => {
          console.error(err);
        }
      );
    } else {
      // We don't have a firebase user, we are not signed in
      this._currentFirebaseUser = null;
      this.isSignedIn = false;
      this.uid = "";

      this.authState$.next(null);
    }
  };

  private firebaseAuthChangeError = (error: any) => {
    console.error(error);
  };

  public signInEmailPassword(email, password) {
    return new Promise<firebase.default.auth.UserCredential>(
      (resolve, reject) => {
        this.angularFireAuth.signInWithEmailAndPassword(email, password).then(
          (res) => {
            resolve(res);
          },
          (err) => reject(err)
        );
      }
    );
  }

  public signInGoogle() {
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

  public logUserOut(): Promise<void> {
    return this.angularFireAuth.signOut();
  }

  public createAccount(email, confirmedPassword, displayName) {
    return new Promise<firebase.default.auth.UserCredential>(
      (resolve, reject) => {
        this.angularFireAuth
          .createUserWithEmailAndPassword(email, confirmedPassword)
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
