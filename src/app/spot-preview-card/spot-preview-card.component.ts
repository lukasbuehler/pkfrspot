import { trigger, transition, style, animate } from "@angular/animations";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  LOCALE_ID,
  OnChanges,
} from "@angular/core";
import { Router } from "@angular/router";
import { Spot, SpotPreviewData } from "../../scripts/db/Spot";
import { StorageService } from "../services/storage.service";
import { MatCardModule } from "@angular/material/card";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { NgOptimizedImage } from "@angular/common";
import { SpotRatingComponent } from "../spot-rating/spot-rating.component";

@Component({
  selector: "app-spot-preview-card",
  templateUrl: "./spot-preview-card.component.html",
  styleUrls: ["./spot-preview-card.component.scss"],
  standalone: true,
  imports: [
    MatCardModule,
    MatRippleModule,
    MatIconModule,
    NgOptimizedImage,
    SpotRatingComponent,
  ],
})
export class SpotPreviewCardComponent implements OnChanges {
  @Input() spot: Spot.Class | SpotPreviewData;
  @Input() infoOnly: boolean = false;
  @Input() clickable: boolean = false;
  @Input() isCompact: boolean = false;

  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();

  spotName: string;
  spotLocality: string;
  spotImage: string;

  bookmarked = false;
  visited = false;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private _router: Router,
    public storageService: StorageService
  ) {}

  ngOnChanges() {
    if (this.spot) {
      if (this.spot instanceof Spot.Class) {
        this.spotName = this.spot.getName(this.locale);
        this.spotLocality = this.spot.getLocalityString();
        this.spotImage = this.spot.previewImage;
      } else {
        this.spotName = this.spot.name;
        this.spotLocality = this.spot.locality;
        this.spotImage = this.spot.imageSrc;
      }
    }
  }

  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }

  onClick() {
    if (this.clickable) {
      // open the spot in the spot map
      this._router.navigateByUrl(`/map/${this.spot.id}`);
    }
  }

  shareSpot() {
    // TODO
  }
}
