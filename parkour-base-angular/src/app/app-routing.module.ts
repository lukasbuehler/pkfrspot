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

const routes: Routes = [
  // Home page and posts (displays posts and updates)
  { path: "", component: HomePageComponent },
  { path: "home", redirectTo: "/", pathMatch: "full" },
  { path: "p/:postID", component: PostPageComponent },

  // Map page
  { path: "map", component: MapPageComponent },
  { path: "map/:spotID", component: MapPageComponent },
  { path: "s/:spotID", component: SpotDetailComponent },
  { path: "kml-import", component: KmlImportPageComponent },

  // Community, Groups, Teams, Sessions
  { path: "community", component: CommunityPageComponent },
  { path: "g/:groupID", component: CommunityPageComponent },
  { path: "t/:teamID", component: CommunityPageComponent },

  // Wiki page
  { path: "wiki", component: WikiPageComponent },

  // Profiles and sign-in flow
  { path: "u/:userID", component: ProfilePageComponent },
  { path: "sign-in", component: SignInPageComponent },
  { path: "sign-up", component: SignUpPageComponent },

  // Other
  { path: "about", component: AboutPageComponent },
  { path: "welcome", component: WelcomePageComponent },
  { path: "**", component: NotFoundPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
