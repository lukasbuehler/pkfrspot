import { Component, OnInit } from "@angular/core";
import { AuthenticationService } from "../authentication.service";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";

@Component({
  selector: "app-sign-in-page",
  templateUrl: "./sign-in-page.component.html",
  styleUrls: ["./sign-in-page.component.scss"],
})
export class SignInPageComponent implements OnInit {
  signInForm: UntypedFormGroup;
  signInError: string = "";

  constructor(
    private _authService: AuthenticationService,
    private _formBuilder: UntypedFormBuilder,
    private _router: Router
  ) {}

  ngOnInit() {
    this.signInForm = this._formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
    });
  }

  get emailFieldHasError(): boolean {
    return (
      this.signInForm.controls["email"].invalid &&
      (this.signInForm.controls["email"].dirty ||
        this.signInForm.controls["email"].touched)
    );
  }

  get passwordFieldHasError(): boolean {
    return this.signInForm.controls["password"].invalid;
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
        switch (err.code) {
          case "auth/invalid-email":
            this.signInError = "The E-Mail address is invalid!";
            break;
          case "auth/invalid-password":
            this.signInError = "The password is invalid!";
            break;
          case "auth/user-not-found":
          case "auth/wrong-password":
            this.signInError =
              "The E-Mail address and password do not match for any existing user.";
            break;
          default:
            this.signInError =
              "An unknown error has occured on sign in. Please try again.";
            break;
        }
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
