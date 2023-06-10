import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";

import { environment } from "src/environments/environment";

// Other imports
import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { register as registerSwiper } from "swiper/element/bundle"; // image gallery
registerSwiper();

// Firebase
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import {
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  getFirestore,
  provideFirestore,
} from "@angular/fire/firestore";
import { getStorage, provideStorage } from "@angular/fire/storage";

// Angular material
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyCheckboxModule as MatCheckboxModule } from "@angular/material/legacy-checkbox";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatBadgeModule } from "@angular/material/badge";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { MatTabsModule } from "@angular/material/tabs";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { MatIconModule } from "@angular/material/icon";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatRippleModule } from "@angular/material/core";
import {
  MatLegacyDialogModule as MatDialogModule,
  MAT_LEGACY_DIALOG_DEFAULT_OPTIONS as MAT_DIALOG_DEFAULT_OPTIONS,
} from "@angular/material/legacy-dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from "@angular/material/legacy-progress-spinner";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from "@angular/material/legacy-autocomplete";
import { MatLegacyListModule as MatListModule } from "@angular/material/legacy-list";
import { MatStepperModule } from "@angular/material/stepper";
import { MatDividerModule } from "@angular/material/divider";
import { MatLegacySlideToggleModule as MatSlideToggleModule } from "@angular/material/legacy-slide-toggle";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { MatLegacyChipsModule as MatChipsModule } from "@angular/material/legacy-chips";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { MatButtonToggleModule } from "@angular/material/button-toggle";

// Angular components
import { AppComponent } from "./app.component";
import { HomePageComponent } from "./home-page/home-page.component";
import { MapPageComponent } from "./map-page/map-page.component";
import { NotFoundPageComponent } from "./not-found-page/not-found-page.component";
import { WikiPageComponent } from "./wiki-page/wiki-page.component";
import { PageHeaderComponent } from "./page-header/page-header.component";
import { PostCollectionComponent } from "./post-collection/post-collection.component";
import { PostComponent } from "./post/post.component";
import { SpotPreviewCardComponent } from "./spot-preview-card/spot-preview-card.component";
import { SignInPageComponent } from "./sign-in-page/sign-in-page.component";
import { EditPostDialogComponent } from "./edit-post-dialog/edit-post-dialog.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RatingComponent } from "./rating/rating.component";
import { SpotCompactViewComponent } from "./spot-compact-view/spot-compact-view.component";
import { UploadMediaUiComponent } from "./upload-media-ui/upload-media-ui.component";
import { CommunityPageComponent } from "./community-page/community-page.component";
import { AboutPageComponent } from "./about-page/about-page.component";
import { FancyCounterComponent } from "./fancy-counter/fancy-counter.component";
import { KmlImportPageComponent } from "./kml-import-page/kml-import-page.component";
import { ProfilePageComponent } from "./profile-page/profile-page.component";
import { PostPageComponent } from "./post-page/post-page.component";
import { SpeedDialFabComponent } from "./speed-dial-fab/speed-dial-fab.component";
import { RegexInputComponent } from "./regex-input/regex-input.component";
import { WelcomePageComponent } from "./welcome-page/welcome-page.component";
import { SignUpPageComponent } from "./sign-up-page/sign-up-page.component";
import { TermsOfServiceComponent } from "./terms-of-service/terms-of-service.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import {
  FollowDurationPipe,
  FollowListComponent,
} from "./follow-list/follow-list.component";
import { EditProfileComponent } from "./edit-profile/edit-profile.component";
import { SettingsPageComponent } from "./settings-page/settings-page.component";
//import { ServiceWorkerModule } from "@angular/service-worker";
import { ForgotPasswordPageComponent } from "./forgot-password-page/forgot-password-page.component";
import { DiscoverSpotsViewComponent } from "./discover-spots-view/discover-spots-view.component";
import { MediaPreviewGridComponent } from "./media-preview-grid/media-preview-grid.component";

import { GoogleMapsModule } from "@angular/google-maps";

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
    SpotPreviewCardComponent,
    SignInPageComponent,
    EditPostDialogComponent,
    RatingComponent,
    SpotCompactViewComponent,
    UploadMediaUiComponent,
    CommunityPageComponent,
    AboutPageComponent,
    FancyCounterComponent,
    KmlImportPageComponent,
    ProfilePageComponent,
    PostPageComponent,
    SpeedDialFabComponent,
    RegexInputComponent,
    WelcomePageComponent,
    SignUpPageComponent,
    TermsOfServiceComponent,
    PrivacyPolicyComponent,
    FollowListComponent,
    EditProfileComponent,
    FollowDurationPipe,
    SettingsPageComponent,
    ForgotPasswordPageComponent,
    DiscoverSpotsViewComponent,
    MediaPreviewGridComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,

    // firestore
    provideFirebaseApp(() => initializeApp(environment.keys.firebaseConfig)),
    provideFirestore(() => {
      const firestore = getFirestore();
      connectFirestoreEmulator(firestore, "localhost", 8080);
      return firestore;
    }),
    provideStorage(() => getStorage()),

    // Angular material modules
    BrowserAnimationsModule,
    InfiniteScrollModule,
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
    MatDialogModule,
    MatExpansionModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatListModule,
    MatStepperModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DragDropModule,
    MatButtonToggleModule,

    // Other modules
    // ServiceWorkerModule.register("ngsw-worker.js", {
    //   enabled: environment.production,
    // }),

    GoogleMapsModule,
  ],
  exports: [MatButtonModule],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
