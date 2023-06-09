import { Component, OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import * as firebase from "firebase/compat";
import { AuthenticationService } from "../authentication.service";

@Component({
  selector: "app-forgot-password-page",
  templateUrl: "./forgot-password-page.component.html",
  styleUrls: ["./forgot-password-page.component.scss"],
})
export class ForgotPasswordPageComponent implements OnInit {
  forgotPasswordForm: UntypedFormGroup;
  forgotPasswordError: string = "";

  private _recaptchaSolved = false;
  recaptcha: firebase.default.auth.RecaptchaVerifier = null;
  sendingSuccessful: boolean = false;

  constructor(
    private _authService: AuthenticationService,
    private _formBuilder: UntypedFormBuilder,
    private _router: Router
  ) {
    this.forgotPasswordForm = this._formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.setupForgetPasswordReCaptcha();
  }

  get emailFieldHasError(): boolean {
    return (
      this.forgotPasswordForm.controls["email"].invalid &&
      (this.forgotPasswordForm.controls["email"].dirty ||
        this.forgotPasswordForm.controls["email"].touched)
    );
  }

  setupForgetPasswordReCaptcha() {
    this.recaptcha = new firebase.default.auth.RecaptchaVerifier(
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
    this.recaptcha.render();
  }

  resetPassword(forgotPasswordFormValue) {
    console.log("resetting password");

    if (this.sendingSuccessful) {
      console.log("The email was already sent!");
      return;
    }

    let email = forgotPasswordFormValue.email;
    if (!this._recaptchaSolved) {
      this.recaptcha.verify().then(
        (str) => {
          console.log(str);
          this.sendingSuccessful = true;
        },
        (err) => {
          console.error(err);
        }
      );
    }
    this._authService.angularFireAuth.sendPasswordResetEmail(email);
  }
}
