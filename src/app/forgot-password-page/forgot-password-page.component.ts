import { Component, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthenticationService } from "../services/firebase/authentication.service";
import { RecaptchaVerifier, sendPasswordResetEmail } from "firebase/auth";
import { MatIcon } from "@angular/material/icon";
import { MatButton } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel, MatError } from "@angular/material/form-field";
import { PageHeaderComponent } from "../page-header/page-header.component";

@Component({
  selector: "app-forgot-password-page",
  templateUrl: "./forgot-password-page.component.html",
  styleUrls: ["./forgot-password-page.component.scss"],
  imports: [
    PageHeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    NgIf,
    MatError,
    MatButton,
    MatIcon,
  ],
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
    this.recaptcha = new RecaptchaVerifier(
      this._authService.auth,
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
    sendPasswordResetEmail(this._authService.auth, email);
  }
}
