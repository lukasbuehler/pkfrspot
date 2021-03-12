import { Component, OnInit } from "@angular/core";
import {
  FirebaseUISignInSuccessWithAuthResult,
  FirebaseUISignInFailure,
} from "firebaseui-angular";
import * as firebase from "firebase/app";
import { AuthenticationService } from "../authentication.service";

@Component({
  selector: "app-sign-in-page",
  templateUrl: "./sign-in-page.component.html",
  styleUrls: ["./sign-in-page.component.scss"],
})
export class SignInPageComponent implements OnInit {
  constructor(public authService: AuthenticationService) {}

  ngOnInit() {}
}
