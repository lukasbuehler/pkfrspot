import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";

import { AppComponent } from "./app.component";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { environment } from "src/environments/environment";
import { AngularFireModule } from "@angular/fire";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AngularFireStorageModule } from "@angular/fire/storage";
import { AngularFireAuthModule } from "@angular/fire/auth";

import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AgmCoreModule } from "@agm/core";
import { FirebaseUIModule, firebase, firebaseui } from "firebaseui-angular";

import { MatButtonModule, MatCheckboxModule } from "@angular/material";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatBadgeModule } from "@angular/material/badge";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatCardModule } from "@angular/material/card";
import { MatTabsModule } from "@angular/material/tabs";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatRippleModule } from "@angular/material/core";
import { MatDialogModule } from "@angular/material/dialog";

import { HomePageComponent } from "./home-page/home-page.component";
import { MapPageComponent } from "./map-page/map-page.component";
import { NotFoundPageComponent } from "./not-found-page/not-found-page.component";
import { WikiPageComponent } from "./wiki-page/wiki-page.component";
import { PageHeaderComponent } from "./page-header/page-header.component";
import { PostCollectionComponent } from "./post-collection/post-collection.component";
import { PostComponent } from "./post/post.component";
import { SpotCardComponent } from "./spot-card/spot-card.component";
import { SignInPageComponent } from "./sign-in-page/sign-in-page.component";
import { EditPostDialogComponent } from "./edit-post-dialog/edit-post-dialog.component";

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    MapPageComponent,
    NotFoundPageComponent,
    WikiPageComponent,
    PageHeaderComponent,
    PostCollectionComponent,
    PostComponent,
    SpotCardComponent,
    SignInPageComponent,
    EditPostDialogComponent
  ],
  entryComponents: [EditPostDialogComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,

    NgbModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,

    InfiniteScrollModule,
    AgmCoreModule.forRoot({
      apiKey: environment.keys.google_maps
    }),
    FirebaseUIModule.forRoot(
      environment.firebaseUiAuthConfig as firebaseui.auth.Config
    ),

    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSidenavModule,
    MatCardModule,
    MatTabsModule,
    MatMenuModule,
    MatIconModule,
    MatInputModule,
    MatRippleModule,
    MatDialogModule
  ],
  exports: [MatButtonModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
