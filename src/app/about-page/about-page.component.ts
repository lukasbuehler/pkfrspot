import { Component, OnInit } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatAnchor } from "@angular/material/button";
import { Meta, Title } from "@angular/platform-browser";

@Component({
  selector: "app-about-page",
  templateUrl: "./about-page.component.html",
  styleUrls: ["./about-page.component.scss"],
  standalone: true,
  imports: [MatAnchor, MatIcon],
})
export class AboutPageComponent implements OnInit {
  constructor(private titleService: Title, private meta: Meta) {
    // update the meta tags

    this.titleService.setTitle($localize`:@@about.title:About PKFR Spot`);

    this.meta.updateTag({
      property: "og:title",
      content: $localize`:@@about.title:About PKFR Spot`,
    });
    this.meta.updateTag({
      name: "twitter:title",
      content: $localize`:@@about.title:About PKFR Spot`,
    });

    this.meta.updateTag({
      property: "og:image",
      content: "assets/banner_1200x630.png",
    });
    this.meta.updateTag({
      name: "twitter:image",
      content: "assets/banner_1200x630.png",
    });

    // this.meta.updateTag({ name: 'description', content: 'About PKFR Spot' });
  }

  ngOnInit(): void {}
}
