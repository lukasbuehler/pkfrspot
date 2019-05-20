import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { NotFoundPageComponent } from './not-found-page/not-found-page.component';
import { MapPageComponent } from './map-page/map-page.component';

const routes: Routes = [
  { path: "", component: HomePageComponent },
  { path: "home", redirectTo: "/", pathMatch: "full" },
  { path: "map", component: MapPageComponent },

  { path: "**", component: NotFoundPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
