import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomePageComponent } from "./home-page/home-page.component";
import { NotFoundPageComponent } from "./not-found-page/not-found-page.component";
import { MapPageComponent } from "./map-page/map-page.component";
import { WikiPageComponent } from "./wiki-page/wiki-page.component";
import { SignInPageComponent } from "./sign-in-page/sign-in-page.component";
import { CommunityPageComponent } from "./community-page/community-page.component";
import { AboutPageComponent } from "./about-page/about-page.component";

const routes: Routes = [
  { path: "", component: HomePageComponent },
  { path: "home", redirectTo: "/", pathMatch: "full" },
  { path: "map", component: MapPageComponent },
  { path: "map/:spot", component: MapPageComponent },
  { path: "wiki", component: WikiPageComponent },
  { path: "community", component: CommunityPageComponent },
  { path: "about", component: AboutPageComponent },
  { path: "sign-in", component: SignInPageComponent },

  { path: "**", component: NotFoundPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
