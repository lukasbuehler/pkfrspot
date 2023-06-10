import { resolve } from "@angular/compiler-cli/src/ngtsc/file_system";
import { Injectable } from "@angular/core";
import {
  Auth,
  GoogleAuthProvider,
  UserCredential,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  User as FirebaseUser,
  signOut,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  updateProfile,
} from "@angular/fire/auth";
import { rejects } from "assert";
import { Observable, Subject } from "rxjs";
import { map, filter, tap } from "rxjs/operators";
import { User } from "src/scripts/db/User";
import { DatabaseService } from "./database.service";

interface AuthServiceUser {
  uid?: string;
  email?: string;
  emailVerified?: boolean;
  data?: User.Class;
}

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  // Public properties
  public isSignedIn: boolean = false;
  /**
   * The user from the database corresponding to the currently authenticated user
   */
  public user: AuthServiceUser = {};

  public authState$: Subject<AuthServiceUser> = new Subject();

  public auth = getAuth();

  constructor(private _databaseService: DatabaseService) {
    // this.auth.onAuthStateChanged(
    //   this.firebaseAuthChangeListener,
    //   this.firebaseAuthChangeError
    // );
  }

  private _currentFirebaseUser: FirebaseUser = null;

  private firebaseAuthChangeListener = (firebaseUser: FirebaseUser) => {
    // Auth state changed
    if (firebaseUser) {
      // If we have a firebase user, we are signed in.
      this._currentFirebaseUser = firebaseUser;
      this.isSignedIn = true;

      this.user.uid = firebaseUser.uid;
      this.user.email = firebaseUser.email;
      this.user.emailVerified = firebaseUser.emailVerified;

      this._fetchUserData(firebaseUser.uid, true);
    } else {
      // We don't have a firebase user, we are not signed in
      this._currentFirebaseUser = null;
      this.isSignedIn = false;
      this.user.uid = "";

      this.authState$.next(null);
    }
  };

  private firebaseAuthChangeError = (error: any) => {
    console.error(error);
  };

  private _fetchUserData(uid, sendUpdate = true) {
    this._databaseService.getUserById(uid).subscribe(
      (_user) => {
        this.user.data = _user;

        if (sendUpdate) {
          this.authState$.next(this.user);
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }

  /**
   * Refetches the user data from the database. This only updates the data of the currently authenticated user.
   *
   * Meaning if, for example the display name changed in the background and this function is called on your own profile page, the name only changes in the navbar in the top right but not in the profile. Since the profile information is fetched seperately from the data belonging to the corresponding user
   *
   * Also: Following and Followers are not updated with this function call. Only things like display name, profile picture and so on.
   */
  public refetchUserData() {
    this._fetchUserData(this.user.uid, true);
  }

  public signInEmailPassword(email, password) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  public signInGoogle(): Promise<UserCredential> {
    let provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");

    return signInWithPopup(this.auth, provider);
  }

  public logUserOut(): Promise<void> {
    return signOut(this.auth);
  }

  public resendVerificationEmail(): Promise<void> {
    return sendEmailVerification(this._currentFirebaseUser);
  }

  public createAccount(
    email: string,
    confirmedPassword: string,
    displayName: string,
    inviteCode?: string
  ) {
    return createUserWithEmailAndPassword(
      this.auth,
      email,
      confirmedPassword
    ).then((res) => {
      // Set the user chose Display name
      updateProfile(this._currentFirebaseUser, {
        displayName: displayName,
      });

      // TODO make sure that the user id is the same as the database user
      // id in the backend or some freaky stuff might happen

      // create a database entry for the user
      this._databaseService.addUser(res.user.uid, displayName, {
        invite_code: inviteCode,
      });
    });
  }
}
