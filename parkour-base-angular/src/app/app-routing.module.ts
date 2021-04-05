import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomePageComponent } from "./home-page/home-page.component";
import { NotFoundPageComponent } from "./not-found-page/not-found-page.component";
import { MapPageComponent } from "./map-page/map-page.component";
import { WikiPageComponent } from "./wiki-page/wiki-page.component";
import { SignInPageComponent } from "./sign-in-page/sign-in-page.component";
import { CommunityPageComponent } from "./community-page/community-page.component";
import { AboutPageComponent } from "./about-page/about-page.component";
import { KmlImportPageComponent } from "./kml-import-page/kml-import-page.component";
import { PostPageComponent } from "./post-page/post-page.component";
import { ProfilePageComponent } from "./profile-page/profile-page.component";
import { WelcomePageComponent } from "./welcome-page/welcome-page.component";
import { SpotDetailComponent } from "./spot-detail/spot-detail.component";
import { SignUpPageComponent } from "./sign-up-page/sign-up-page.component";
import { TermsOfServiceComponent } from "./terms-of-service/terms-of-service.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import { EditProfileComponent } from "./edit-profile/edit-profile.component";
import { SettingsPageComponent } from "./settings-page/settings-page.component";

const routes: Routes = [
  // Home page and posts (displays posts and updates)
  { path: "home", component: HomePageComponent },
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "p/:postID", component: PostPageComponent },

  // Map page
  { path: "map", component: MapPageComponent },
  { path: "map/:spotID", component: MapPageComponent },
  //{ path: "s/:spotID", component: SpotDetailComponent },
  { path: "kml-import", component: KmlImportPageComponent },

  // Community, Groups, Teams, Sessions
  { path: "community", component: CommunityPageComponent },
  { path: "g/:groupID", component: CommunityPageComponent },
  { path: "team/:teamID", component: CommunityPageComponent },

  // Wiki page
  { path: "wiki", component: WikiPageComponent },

  // Profiles and sign-in flow
  { path: "u/:userID", component: ProfilePageComponent },
  { path: "sign-in", component: SignInPageComponent },
  { path: "sign-up", component: SignUpPageComponent },

  // Settings
  { path: "settings", component: SettingsPageComponent },
  { path: "settings/:tab", component: SettingsPageComponent },

  // Other
  { path: "about", component: AboutPageComponent },
  { path: "welcome", component: WelcomePageComponent },
  // { path: "landing", component: LandingPageComponent },
  { path: "terms_of_service", component: TermsOfServiceComponent },
  { path: "tos", redirectTo: "/terms_of_service", pathMatch: "full" },
  { path: "privacy_policy", component: PrivacyPolicyComponent },
  { path: "pp", redirectTo: "/privacy_policy", pathMatch: "full" },
  { path: "**", component: NotFoundPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
