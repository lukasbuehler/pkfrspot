import { enableProdMode, importProvidersFrom } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";


import { environment } from "./environments/environment";
import { AppComponent } from "./app/app.component";
import { provideFunctions, getFunctions } from "@angular/fire/functions";
import { GoogleMapsModule } from "@angular/google-maps";
import { VgBufferingModule } from "@videogular/ngx-videogular/buffering";
import { VgOverlayPlayModule } from "@videogular/ngx-videogular/overlay-play";
import { VgControlsModule } from "@videogular/ngx-videogular/controls";
import { VgCoreModule } from "@videogular/ngx-videogular/core";
import { MatRadioModule } from "@angular/material/radio";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatTableModule } from "@angular/material/table";
import { MatChipsModule } from "@angular/material/chips";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatDividerModule } from "@angular/material/divider";
import { MatStepperModule } from "@angular/material/stepper";
import { MatListModule } from "@angular/material/list";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatRippleModule, MatNativeDateModule } from "@angular/material/core";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { MatCardModule } from "@angular/material/card";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatBadgeModule } from "@angular/material/badge";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonModule } from "@angular/material/button";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideStorage, getStorage } from "@angular/fire/storage";
import { provideFirestore, getFirestore } from "@angular/fire/firestore";
import { environment as environment_1 } from "src/environments/environment";
import { provideFirebaseApp, initializeApp } from "@angular/fire/app";
import { withInterceptorsFromDi, provideHttpClient, HttpClientJsonpModule } from "@angular/common/http";
import { AppRoutingModule } from "./app/app-routing.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { provideClientHydration, BrowserModule, HammerModule, bootstrapApplication } from "@angular/platform-browser";
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule } from "@angular/material/dialog";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, FormsModule, ReactiveFormsModule, AppRoutingModule, HttpClientJsonpModule, 
        // firestore
        provideFirebaseApp(() => initializeApp(environment.keys.firebaseConfig)), provideFirestore(() => {
            //   const firestore = getFirestore();
            //   connectFirestoreEmulator(firestore, "localhost", 8080);
            //   return firestore;
            return getFirestore();
        }), provideStorage(() => getStorage()), HammerModule, MatButtonModule, MatCheckboxModule, MatToolbarModule, MatBadgeModule, MatTooltipModule, MatSidenavModule, MatCardModule, MatTabsModule, MatMenuModule, MatIconModule, MatInputModule, MatRippleModule, MatDialogModule, MatExpansionModule, MatSelectModule, MatProgressSpinnerModule, MatProgressBarModule, MatAutocompleteModule, MatListModule, MatStepperModule, MatDividerModule, MatSlideToggleModule, MatSnackBarModule, MatChipsModule, MatTableModule, MatDatepickerModule, MatNativeDateModule, DragDropModule, MatButtonToggleModule, MatRadioModule, 
        // Other modules
        // ServiceWorkerModule.register("ngsw-worker.js", {
        //   enabled: environment.production,
        // }),
        VgCoreModule, VgControlsModule, VgOverlayPlayModule, VgBufferingModule, GoogleMapsModule, provideFirebaseApp(() => initializeApp(environment.keys.firebaseConfig)), provideFirestore(() => getFirestore()), provideFunctions(() => getFunctions())),
        { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } },
        provideClientHydration(),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
    ]
})
  .catch((err) => console.error(err));

const GOOGLE_MAPS_API_KEY: string = environment.keys.google_maps;
