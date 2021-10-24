// used this answer on github for help: https://github.com/angular/components/issues/13372#issuecomment-447129222

import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { ContributedMedia, Media, MediaType } from "src/scripts/db/Interfaces";

@Component({
  selector: "app-media-preview-grid",
  templateUrl: "./media-preview-grid.component.html",
  styleUrls: ["./media-preview-grid.component.scss"],
})
export class MediaPreviewGridComponent implements OnInit {
  @Input() media: (Media | ContributedMedia)[] = null;

  constructor() {}

  ngOnInit(): void {
    if (this.media && this.media.length > 0) {
      this.media.push({
        src: "https://www.amillion-live.de/wp-content/uploads/2019/10/apache207.jpg",
        uid: "",
        type: MediaType.Image,
      });
      this.media.push({
        src: "https://yt3.ggpht.com/ytc/AKedOLSmELObrWTQUSxHaXp-ItX7KZdRqaZAFLkRQ4LC1A=s900-c-k-c0x00ffffff-no-rj",
        uid: "",
        type: MediaType.Image,
      });
      this.media.push({
        src: "https://cdn.bigfm.de/sites/default/files/styles/medium_square_400/public/scald/image/Apache-207-TEASER.jpeg?itok=iPEuZ5dg",
        uid: "",
        type: MediaType.Image,
      });
      this.media.push({
        src: "https://www.stuttgarter-nachrichten.de/media.media.132ca19e-bd3f-4f4e-8413-eb37d3c4ccc7.original1024.jpg",
        uid: "",
        type: MediaType.Image,
      });
    }
  }

  drop(event: CdkDragDrop<number>) {
    console.log(event);

    moveItemInArray(
      this.media,
      event.previousContainer.data,
      event.container.data
    );
  }
}
