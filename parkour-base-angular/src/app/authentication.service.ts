import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(public angularFireAuth: AngularFireAuth) { 
    this.angularFireAuth.authState.subscribe(this.firebaseAuthChangeListener, this.firebaseAuthChangeError);
  }

  private currentUser: firebase.User = null;
  get user()
  {
    return this.currentUser;
  }

  get userProfilePic()
  {
    return this.currentUser.photoURL;
  }

  firebaseAuthChangeListener = (user: firebase.User) =>
  {
    if (user)
    {
      this.currentUser = user;
    } else
    {
      this.currentUser = null;
    }
  };

  firebaseAuthChangeError = (error: any) => {
    console.error(error);
  }


  isSignedIn(): boolean
  {
    if (this.currentUser)
    {
      return true;
    }
    return false;
  }

  logUserOut(callback: () => void)
  {
    this.angularFireAuth.auth.signOut();
  }
}
