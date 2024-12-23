import { Component, OnInit } from "@angular/core";
import {
  AbstractControl,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthenticationService } from "../authentication.service";
import { RecaptchaVerifier } from "firebase/auth";
import { NgIf } from "@angular/common";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel, MatHint } from "@angular/material/form-field";
import { MatButton } from "@angular/material/button";
import { PageHeaderComponent } from "../page-header/page-header.component";

@Component({
  selector: "app-sign-up-page",
  templateUrl: "./sign-up-page.component.html",
  styleUrls: ["./sign-up-page.component.scss"],
  standalone: true,
  imports: [
    PageHeaderComponent,
    MatButton,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatHint,
    MatCheckbox,
    NgIf,
  ],
})
export class SignUpPageComponent implements OnInit {
  createAccountForm: UntypedFormGroup;
  signUpError: string = "";
  isInviteOnly: boolean = true;

  constructor(
    private _authService: AuthenticationService,
    private _formBuilder: UntypedFormBuilder,
    private _router: Router
  ) {}

  private _recaptchaSolved = false;

  ngOnInit(): void {
    this.createAccountForm = this._formBuilder.group(
      {
        displayName: ["", [Validators.required]],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        repeatPassword: ["", [Validators.required]],
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
    let recaptcha = new RecaptchaVerifier(null, "reCaptchaDiv", {
      size: "invisible",
      callback: (response) => {
        // reCAPTCHA solved, allow sign in
        this._recaptchaSolved = true;
        console.log("recaptcha solved", response);
      },
      "expired-callback": () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        console.error("Response expired");
      },
    });
    recaptcha.render();
  }

  tryCreateAccount(createAccountFormValue) {
    let displayName = createAccountFormValue.displayName;
    let email = createAccountFormValue.email;
    const password = createAccountFormValue.password;
    const repeatedPassword = createAccountFormValue.repeatPassword;
    const agreeCheck = !!createAccountFormValue.agreeCheck;
    const inviteCode = createAccountFormValue.inviteCode;

    // trim, lower case and validate email address
    email = String(email).toLowerCase().trim();

    // check that the repeated password matches the password
    if (!password || !repeatedPassword || password !== repeatedPassword) {
      console.error("Password and repeated password don't match");
      this.signUpError = $localize`Password and repeated password don't match`;
      return;
    }

    // check if the terms of service and legal shebang was accepted
    if (!agreeCheck) {
      console.error("User did not agree!");
      this.signUpError = $localize`You need to agree to the terms and conditions!`;
      return;
    }

    // only then create a new account
    this._createAccount(email, password, displayName);
  }

  private _createAccount(email: string, password: string, displayName: string) {
    this._authService
      .createAccount(email, password, displayName)
      .then(() => {
        console.log("Created account!");
        // TODO nvaigate to the last page
        this._router.navigateByUrl("/");
      })
      .catch((err) => {
        console.error("Cannot create account!", err);
        this.signUpError = $localize`Could not create account!`;
      });
  }
}
