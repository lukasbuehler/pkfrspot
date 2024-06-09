import { trigger, transition, style, animate } from "@angular/animations";
import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";
import { Spot } from "../../scripts/db/Spot";
import { StorageService } from "../storage.service";
import { MatCardModule } from "@angular/material/card";
import { MatRippleModule } from "@angular/material/core";

@Component({
  selector: "app-spot-preview-card",
  templateUrl: "./spot-preview-card.component.html",
  styleUrls: ["./spot-preview-card.component.scss"],
  standalone: true,
  imports: [MatCardModule, MatRippleModule],
})
export class SpotPreviewCardComponent implements OnInit {
  @Input() spot: Spot.Class;
  @Input() infoOnly: boolean = false;
  @Input() clickable: boolean = false;
  @Input() isCompact: boolean = false;

  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();

  bookmarked = false;
  visited = false;

  constructor(private _router: Router, public storageService: StorageService) {}

  ngOnInit() {}

  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }

  onClick() {
    if (this.clickable) {
      // open the spot in the spot map
      this._router.navigateByUrl(`/map?spot=${this.spot.id}`);
    }
  }

  shareSpot() {
    // TODO
  }
}
