import { Component, inject, OnInit } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatAnchor } from "@angular/material/button";
import { Meta, Title } from "@angular/platform-browser";
import { NgOptimizedImage } from "@angular/common";
import { MetaInfoService } from "../services/meta-info.service";

@Component({
  selector: "app-about-page",
  templateUrl: "./about-page.component.html",
  styleUrls: ["./about-page.component.scss"],
  imports: [MatAnchor, MatIcon, NgOptimizedImage],
})
export class AboutPageComponent implements OnInit {
  private _metaInfoService = inject(MetaInfoService);

  ngOnInit(): void {
    this._metaInfoService.setMetaTags(
      $localize`:@@about.title:About PKFR Spot`,
      "assets/banner_1200x630.png",
      $localize`:@@about.description:About PKFR Spot`
    );
  }
}
