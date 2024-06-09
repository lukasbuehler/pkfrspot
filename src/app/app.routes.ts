import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomePageComponent } from "./home-page/home-page.component";
import { NotFoundPageComponent } from "./not-found-page/not-found-page.component";
import { MapPageComponent } from "./map-page/map-page.component";
import { SignInPageComponent } from "./sign-in-page/sign-in-page.component";
import { AboutPageComponent } from "./about-page/about-page.component";
import { KmlImportPageComponent } from "./kml-import-page/kml-import-page.component";
import { PostPageComponent } from "./post-page/post-page.component";
import { ProfilePageComponent } from "./profile-page/profile-page.component";
import { SignUpPageComponent } from "./sign-up-page/sign-up-page.component";
import { TermsOfServiceComponent } from "./terms-of-service/terms-of-service.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import { SettingsPageComponent } from "./settings-page/settings-page.component";
import { ForgotPasswordPageComponent } from "./forgot-password-page/forgot-password-page.component";

export const routes: Routes = [
  // Home page and posts (displays posts and updates)
  { path: "posts", component: HomePageComponent, data: { routeName: "Posts" } },
  { path: "", redirectTo: "map", pathMatch: "full" },
  {
    path: "p/:postID",
    redirectTo: "post/:postID",
  },
  {
    path: "post/:postID",
    component: PostPageComponent,
    data: { routeName: "Post" },
  },
  // Map page
  { path: "map", component: MapPageComponent, data: { routeName: "Spot map" } },
  {
    path: "map/:id",
    redirectTo: "map",
  },
  {
    path: "kml-import",
    component: KmlImportPageComponent,
    data: { routeName: "KML Import" },
  },

  // Community, Groups, Teams, Sessions
  //   {
  //     path: "community",
  //     component: CommunityPageComponent,
  //     data: { routeName: "Community" },
  //   },
  //   {
  //     path: "g/:groupID",
  //     component: CommunityPageComponent,
  //     data: { routeName: "Group" },
  //   },
  //   {
  //     path: "team/:teamID",
  //     component: CommunityPageComponent,
  //     data: { routeName: "Team" },
  //   },

  // Wiki page
  //   { path: "wiki", component: WikiPageComponent, data: { routeName: "Wiki" } },

  // Profiles and sign-in flow
  {
    path: "u/:userID",
    component: ProfilePageComponent,
    data: { routeName: "Profile" },
  },
  {
    path: "sign-in",
    component: SignInPageComponent,
    data: { routeName: "Sign-in" },
  },
  {
    path: "sign-up",
    component: SignUpPageComponent,
    data: { routeName: "Sign-up" },
  },
  {
    path: "forgot-password",
    component: ForgotPasswordPageComponent,
    data: { routeName: "Forgot password" },
  },

  // Settings
  {
    path: "settings",
    component: SettingsPageComponent,
    data: { routeName: "Settings" },
  },
  {
    path: "settings/:tab",
    component: SettingsPageComponent,
    data: { routeName: "Settings" },
  },

  // Other
  {
    path: "about",
    component: AboutPageComponent,
    data: { routeName: "About" },
  },
  {
    path: "welcome",
    redirectTo: "home",
    pathMatch: "full",
    data: { routeName: "Welcome" },
  }, //component: WelcomePageComponent },
  // { path: "landing", component: LandingPageComponent },
  {
    path: "terms_of_service",
    component: TermsOfServiceComponent,
    data: { routeName: "Terms of Service" },
  },
  { path: "tos", redirectTo: "terms_of_service", pathMatch: "full" },
  {
    path: "privacy_policy",
    component: PrivacyPolicyComponent,
    data: { routeName: "Privacy Policy" },
  },
  { path: "pp", redirectTo: "privacy_policy", pathMatch: "full" },
  { path: "**", component: NotFoundPageComponent },
];
