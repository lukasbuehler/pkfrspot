import { NgOptimizedImage } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { RouterLink } from "@angular/router";
import { MetaInfoService } from "../services/meta-info.service";

@Component({
  selector: "app-events-page",
  imports: [NgOptimizedImage, MatCardModule, RouterLink],
  templateUrl: "./events-page.component.html",
  styleUrl: "./events-page.component.scss",
})
export class EventsPageComponent implements OnInit {
  metaInfoService = inject(MetaInfoService);

  ngOnInit(): void {
    this.metaInfoService.setMetaTags(
      $localize`:@@events.title:Events` + " | PKFR Spot",
      "assets/banner_1200x630.png",
      $localize`:@@events.title:Events`
    );
  }
}
