import { Component, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import * as firebase from "firebase";
import { isEmailValid } from "src/scripts/Helpers";
import { AuthenticationService } from "../authentication.service";

@Component({
  selector: "app-sign-up-page",
  templateUrl: "./sign-up-page.component.html",
  styleUrls: ["./sign-up-page.component.scss"],
})
export class SignUpPageComponent implements OnInit {
  createAccountForm: FormGroup;
  signUpError: string = "";

  constructor(
    private _authService: AuthenticationService,
    private _formBuilder: FormBuilder,
    private _router: Router
  ) {}

  private _recaptchaSolved = false;

  ngOnInit(): void {
    this.createAccountForm = this._formBuilder.group(
      {
        displayName: ["", [Validators.required]],
        email: ["", [Validators.email]],
        password: ["", [Validators.minLength(6)]],
        repeatPassword: ["", []],
        agreeCheck: [false, [Validators.required]],
        inviteCode: ["", Validators.required],
      },
      {
        validators: [
          (c: AbstractControl) => {
            if (c.get("password").value === c.get("repeatPassword").value) {
              return null; // all good
            } else {
              // repeated password does not match password
              return { repeatedPasswordDoesNotMatchPassword: true };
            }
          },
        ],
      }
    );

    this.setupSignUpReCaptcha();
  }

  setupSignUpReCaptcha() {
    let recaptcha = new firebase.default.auth.RecaptchaVerifier(
      "reCaptchaDiv",
      {
        size: "invisible",
        callback: (response) => {
          // reCAPTCHA solved, allow sign in
          this._recaptchaSolved = true;
          console.log("recaptcha solved");
          console.log(response);
        },
        "expired-callback": () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.error("Response expired");
        },
      }
    );
    recaptcha.render();
  }

  tryCreateAccount(createAccountFormValue) {
    let displayName = createAccountFormValue.displayName;
    let email = createAccountFormValue.email;
    const password = createAccountFormValue.password;
    const repeatedPassword = createAccountFormValue.repeatPassword;
    const agreeCheck = !!createAccountFormValue.agreeCheck;

    // trim, lower case and validate email address
    email = String(email).toLowerCase().trim();

    // check that the repeated password matches the password
    if (!password || !repeatedPassword || password !== repeatedPassword) {
      console.error("Password and repeated password don't match");
      this.signUpError = "";
      return;
    }

    // check if the terms of service and legal shebang was accepted
    if (!agreeCheck) {
      console.error("User did not agree!");
      return;
    }

    // check that the reCAPTCHA is valid
    // TODO

    // only then create a new account

    console.log("Creating account:", email, password);
    this._authService
      .createAccount(email, password, displayName)
      .then((val) => {
        this._router.navigateByUrl("/welcome");
      })
      .catch((err) => {});
  }
}
