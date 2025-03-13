import { trigger, transition, style, animate } from "@angular/animations";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  LOCALE_ID,
  OnChanges,
  ElementRef,
  inject,
  input,
  computed,
} from "@angular/core";
import { Router } from "@angular/router";
import { LocalSpot, Spot } from "../../db/models/Spot";
import { SpotPreviewData } from "../../db/schemas/SpotPreviewData";
import { StorageService } from "../services/firebase/storage.service";
import { MatCardModule } from "@angular/material/card";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { NgOptimizedImage } from "@angular/common";
import { SpotRatingComponent } from "../spot-rating/spot-rating.component";
import {
  SizedUserMedia,
  LocaleCode,
  OtherMedia,
  MediaType,
} from "../../db/models/Interfaces";

@Component({
  selector: "app-spot-preview-card",
  templateUrl: "./spot-preview-card.component.html",
  styleUrls: ["./spot-preview-card.component.scss"],
  imports: [
    MatCardModule,
    MatRippleModule,
    MatIconModule,
    NgOptimizedImage,
    SpotRatingComponent,
  ],
})
export class SpotPreviewCardComponent implements OnChanges {
  public elementRef = inject(ElementRef);

  hasBorder = input<boolean>(true);
  imgSize = input<200 | 400 | 800>(200);

  spot = input<Spot | LocalSpot | SpotPreviewData | null>(null);
  @Input() infoOnly: boolean = false;
  @Input() clickable: boolean = false;
  @Input() isCompact: boolean = false;

  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();

  fallbackImgSrc = "/assets/no_media.png";

  spotName?: string;
  spotLocality?: string;
  media = computed<string[]>(() => {
    const spot = this.spot();

    if (!spot) {
      return [];
    }

    if (spot instanceof Spot || spot instanceof LocalSpot) {
      if (spot.media().length === 0) {
        return [this.fallbackImgSrc];
      }
      return spot.media().map((m) => {
        if ("uid" in m) {
          return StorageService.getSrc(m.src, this.imgSize());
        } else {
          return m.src;
        }
      });
    } else {
      return [spot.imageSrc];
    }
  });

  bookmarked = false;
  visited = false;

  constructor(
    @Inject(LOCALE_ID) public locale: LocaleCode,
    private _router: Router,
    public storageService: StorageService
  ) {}

  ngOnChanges() {
    const spot = this.spot();
    if (spot) {
      console.log(spot);
      if (spot instanceof Spot || spot instanceof LocalSpot) {
        this.spotName = spot.name();
        this.spotLocality = spot.localityString();
      } else {
        this.spotName = spot.name;
        this.spotLocality = spot.locality;
      }
    }
  }

  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }

  onClick() {
    if (this.clickable && this.spot && this.spot instanceof Spot) {
      // open the spot in the spot map
      this._router.navigateByUrl(`/map/${this.spot.id}`);
    }
  }

  shareSpot() {
    // TODO
  }
}
