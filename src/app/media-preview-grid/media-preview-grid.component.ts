// used this answer on github for help: https://github.com/angular/components/issues/13372#issuecomment-447129222

import {
  CdkDragDrop,
  moveItemInArray,
  CdkDropListGroup,
  CdkDropList,
  CdkDrag,
} from "@angular/cdk/drag-drop";
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { ContributedMedia, Media, MediaType } from "../../db/models/Interfaces";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";
import { NgIf, NgFor } from "@angular/common";

@Component({
  selector: "app-media-preview-grid",
  templateUrl: "./media-preview-grid.component.html",
  styleUrls: ["./media-preview-grid.component.scss"],
  imports: [
    NgIf,
    CdkDropListGroup,
    NgFor,
    CdkDropList,
    CdkDrag,
    MatIconButton,
    MatIcon,
  ],
})
export class MediaPreviewGridComponent implements OnInit {
  @Input() media: (Media | ContributedMedia)[] = [];
  @Output() mediaChanged: EventEmitter<(Media | ContributedMedia)[]> =
    new EventEmitter<(Media | ContributedMedia)[]>();

  constructor() {}

  ngOnInit(): void {}

  drop(event: CdkDragDrop<number>) {
    moveItemInArray(
      this.media,
      event.previousContainer.data,
      event.container.data
    );

    this.mediaChanged.emit(this.media);
  }

  removeMedia(index: number) {
    let mediaCopy: (Media | ContributedMedia)[] = JSON.parse(
      JSON.stringify(this.media)
    );
    mediaCopy.splice(index, 1);
    this.mediaChanged.emit(mediaCopy);
  }

  editMedia(index: number) {
    console.log("edit media", index);
  }
}
