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

const routes: Routes = [
  // Home page and posts (displays posts and updates)
  { path: "", component: HomePageComponent },
  { path: "home", redirectTo: "/", pathMatch: "full" },
  { path: "post/:postId", component: PostPageComponent },

  // Map page
  { path: "map", component: MapPageComponent },
  { path: "map/:spot", component: MapPageComponent },
  { path: "kml-import", component: KmlImportPageComponent },

  // Community, Groups, Teams, Sessions
  { path: "community", component: CommunityPageComponent },

  // Wiki page
  { path: "wiki", component: WikiPageComponent },

  // Profiles and sign-in flow
  { path: "profile/:profileId", component: ProfilePageComponent },
  { path: "sign-up", component: SignInPageComponent },
  { path: "sign-in", component: SignInPageComponent },

  // Other
  { path: "about", component: AboutPageComponent },
  { path: "**", component: NotFoundPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
