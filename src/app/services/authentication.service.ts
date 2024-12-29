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
import { Subject, firstValueFrom } from "rxjs";
import { User } from "../../db/User";
import { UsersService } from "./firestore-services/users.service";

declare function plausible(eventName: string, options?: { props: any }): void;

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

  constructor(private _userService: UsersService) {
    this.auth.onAuthStateChanged(
      this.firebaseAuthChangeListener,
      this.firebaseAuthChangeError
    );
  }

  private _currentFirebaseUser: FirebaseUser = null;

  private _defaultUserSettings: User.Schema["settings"] = {
    maps: "googlemaps",
  };

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
    this._userService.getUserById(uid).subscribe(
      (_user) => {
        if (_user) {
          this.user.data = _user;

          if (sendUpdate) {
            this.authState$.next(this.user);
          }
        } else {
          console.error("User data not found for uid", uid);
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

  public async signInGoogle(): Promise<void> {
    let provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");

    let googleSignInResponse = await signInWithPopup(this.auth, provider);

    // check if the user exists in the database
    try {
      let user: User.Class | null = await firstValueFrom(
        this._userService.getUserById(googleSignInResponse.user.uid)
      );
      if (!user) {
        // This is a new user!
        if (typeof plausible !== "undefined") {
          plausible("Create Account", {
            props: { accountType: "Google" },
          });
        }

        // create a database entry for the user
        this._userService.addUser(
          googleSignInResponse.user.uid,
          googleSignInResponse.user.displayName,
          {
            verified_email: googleSignInResponse.user.emailVerified, // TODO check
            settings: this._defaultUserSettings,
          }
        );
      }
    } catch (error) {
      // user does not exist
      console.error(error);
    }
  }

  public logUserOut(): Promise<void> {
    return signOut(this.auth);
  }

  public resendVerificationEmail(): Promise<void> {
    return sendEmailVerification(this._currentFirebaseUser);
  }

  public async createAccount(
    email: string,
    confirmedPassword: string,
    displayName: string
  ): Promise<void> {
    let firebaseAuthResponse = await createUserWithEmailAndPassword(
      this.auth,
      email,
      confirmedPassword
    );

    if (typeof plausible !== "undefined") {
      plausible("Create Account", {
        props: { accountType: "Email and Password" },
      });
    }

    // Set the user chose Display name
    updateProfile(this._currentFirebaseUser, {
      displayName: displayName,
    });

    // create a database entry for the user
    this._userService.addUser(firebaseAuthResponse.user.uid, displayName, {
      verified_email: false,
      settings: this._defaultUserSettings,
    });

    // Send verification email
    sendEmailVerification(firebaseAuthResponse.user);
  }
}
