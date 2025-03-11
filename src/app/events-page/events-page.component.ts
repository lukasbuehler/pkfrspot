import { NgOptimizedImage } from "@angular/common";
import { Component, inject, LOCALE_ID, OnInit } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { RouterLink } from "@angular/router";
import { MetaInfoService } from "../services/meta-info.service";
import { LocaleCode } from "../../db/models/Interfaces";

@Component({
  selector: "app-events-page",
  imports: [NgOptimizedImage, MatCardModule, RouterLink],
  templateUrl: "./events-page.component.html",
  styleUrl: "./events-page.component.scss",
})
export class EventsPageComponent implements OnInit {
  metaInfoService = inject(MetaInfoService);
  locale = inject<LocaleCode>(LOCALE_ID);

  start: Date = new Date("2025-05-24T09:00:00+01:00");
  end: Date = new Date("2025-05-25T16:00:00+01:00");
  readableStartDate: string = this.start.toLocaleDateString(this.locale, {
    dateStyle: "full",
  });
  readableEndDate: string = this.end.toLocaleDateString(this.locale, {
    dateStyle: "full",
  });

  ngOnInit(): void {
    this.metaInfoService.setMetaTags(
      $localize`:@@events.title:Events` + " | PK Spot",
      "/assets/banner_1200x630.png",
      $localize`:@@events.title:Events`
    );
  }
}
