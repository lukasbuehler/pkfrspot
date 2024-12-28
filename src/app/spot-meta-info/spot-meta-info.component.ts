import { isPlatformServer } from "@angular/common";
import {
  Component,
  Inject,
  InputSignal,
  LOCALE_ID,
  PLATFORM_ID,
  input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import { Spot } from "../../scripts/db/Spot";

@Component({
  selector: "app-spot-meta-info",
  standalone: true,
  imports: [],
  templateUrl: "./spot-meta-info.component.html",
  styleUrl: "./spot-meta-info.component.scss",
})
export class SpotMetaInfoComponent implements OnInit, OnChanges {
  spot: InputSignal<Spot.Class> = input<Spot.Class>();

  isServer: boolean;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    @Inject(PLATFORM_ID) platformId: Object,
    public titleService: Title,
    private meta: Meta
  ) {
    this.isServer = isPlatformServer(platformId);
  }

  ngOnInit() {
    this.setSpotMetaTags();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["spot"] && !changes["spot"].isFirstChange()) {
      this.setSpotMetaTags();
    }
  }

  setSpotMetaTags() {
    const spot = this.spot();

    if (spot === null) {
      this.clearTitleAndMetaTags();
      return;
    }

    const title: string = `${spot.getName(this.locale)} - PKFR Spot`;
    const image_src: string = spot.previewImage;
    const description: string =
      $localize`:The text before the localized location of the spot. E.g. Spot in Wiedikon, Zurich, CH@@spot.locality.pretext:Spot in ` +
      spot.getLocalityString(); // TODO change and localize

    // Title
    this.titleService.setTitle(title);
    this.meta.updateTag({
      property: "og:title",
      content: title,
    });
    this.meta.updateTag({
      name: "twitter:title",
      content: title,
    });

    // Image
    this.meta.updateTag({
      property: "og:image",
      content: image_src,
    });
    this.meta.updateTag({
      name: "twitter:image",
      content: image_src,
    });

    // Description
    this.meta.updateTag({
      property: "og:description",
      content: description,
    });
    this.meta.updateTag({
      name: "twitter:description",
      content: description,
    });
  }

  clearTitleAndMetaTags() {
    this.titleService.setTitle($localize`:@@pkfr.spotmap.title:PKFR Spot map`);
  }
}
