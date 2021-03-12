import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { isEmailValid } from "src/scripts/Helpers";
import { AuthenticationService } from "../authentication.service";

@Component({
  selector: "app-sign-up-page",
  templateUrl: "./sign-up-page.component.html",
  styleUrls: ["./sign-up-page.component.scss"],
})
export class SignUpPageComponent implements OnInit {
  createAccountForm: FormGroup;

  constructor(
    private _authService: AuthenticationService,
    private _formBuilder: FormBuilder,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.createAccountForm = this._formBuilder.group({
      displayName: ["", [Validators.required]],
      email: ["", [Validators.email]],
      password: ["", [Validators.min(6)]],
      repeatPassword: ["", []],
      agreeCheck: ["", [Validators.required]],
    });
  }

  tryCreateAccount(createAccountFormValue) {
    let displayName = createAccountFormValue.displayName;
    let email = createAccountFormValue.email;
    const password = createAccountFormValue.password;
    const repeatedPassword = createAccountFormValue.repeatPassword;
    const agreeCheck = !!createAccountFormValue.agreeCheck;

    // trim, lower case and validate email address
    email = String(email).toLowerCase().trim();
    if (!email || !isEmailValid(email)) {
      console.error("Email is not valid!");
      return;
    }

    // check that the repeated password matches the password
    if (!password || !repeatedPassword || password !== repeatedPassword) {
      console.error("Password and repeated password don't match");
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
