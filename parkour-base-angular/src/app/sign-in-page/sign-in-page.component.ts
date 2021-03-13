import { Component, OnInit } from "@angular/core";
import {
  FirebaseUISignInSuccessWithAuthResult,
  FirebaseUISignInFailure,
} from "firebaseui-angular";
import * as firebase from "firebase/app";
import { AuthenticationService } from "../authentication.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";

@Component({
  selector: "app-sign-in-page",
  templateUrl: "./sign-in-page.component.html",
  styleUrls: ["./sign-in-page.component.scss"],
})
export class SignInPageComponent implements OnInit {
  signInForm: FormGroup;

  constructor(
    private _authService: AuthenticationService,
    private _formBuilder: FormBuilder,
    private _router: Router
  ) {}

  ngOnInit() {
    this.signInForm = this._formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
    });
  }

  trySignIn(signInFormValue) {
    let email = signInFormValue.email;
    let password = signInFormValue.password;

    email = String(email).toLowerCase().trim();
    this._authService.signInEmailPassword(email, password).then(
      (res) => {
        // login and return the user to where they were or to the home page if
        // no information is available.
        this._router.navigateByUrl("/");
      },
      (err) => {
        // display the error on the login form
        console.error(err);
      }
    );
  }

  trySignInGoogle() {
    this._authService
      .signInGoogle()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
