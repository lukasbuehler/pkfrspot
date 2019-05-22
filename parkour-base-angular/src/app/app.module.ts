import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MatButtonModule, MatCheckboxModule } from '@angular/material';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { HomePageComponent } from './home-page/home-page.component';
import { MapPageComponent } from './map-page/map-page.component';
import { NotFoundPageComponent } from './not-found-page/not-found-page.component';
import { WikiPageComponent } from './wiki-page/wiki-page.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { PostCollectionComponent } from './post-collection/post-collection.component'


@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    MapPageComponent,
    NotFoundPageComponent,
    WikiPageComponent,
    PageHeaderComponent,
    PostCollectionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,

    NgbModule,

    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSidenavModule,
    MatCardModule,
    MatTabsModule,
  ],
  exports: [
    MatButtonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
