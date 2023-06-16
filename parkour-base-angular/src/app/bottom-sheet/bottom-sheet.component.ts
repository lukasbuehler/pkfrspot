import {
  trigger,
  transition,
  style,
  animate,
  state,
} from "@angular/animations";
import { CdkDragDrop } from "@angular/cdk/drag-drop/index.js";
import { Component, Input, ViewChild } from "@angular/core";

@Component({
  selector: "app-bottom-sheet",
  templateUrl: "./bottom-sheet.component.html",
  styleUrls: ["./bottom-sheet.component.scss"],
})
export class BottomSheetComponent {
  _isOpen: boolean = false;
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;

    // do something
    console.log(this.bottomSheet.nativeElement.offsetTop);
  }
  get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() title: string = "";

  @Input() hasMiddleState: boolean = true;

  @ViewChild("bottomSheet", { static: true }) bottomSheet: any;

  onDrop(event: CdkDragDrop<string[]>) {
    console.log(event);
    switch (event.currentIndex) {
      case 0:
        this._isOpen = false;
    }
    if (event.previousIndex > event.currentIndex) {
      // panel was opened (moved up)
      this.isOpen = true;
    } else if (event.previousIndex < event.currentIndex) {
      // panel was closed (moved down)
      this.isOpen = false;
    }
  }
}
