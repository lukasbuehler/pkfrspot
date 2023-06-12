import { CdkDragDrop } from "@angular/cdk/drag-drop/index.js";
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-bottom-sheet",
  templateUrl: "./bottom-sheet.component.html",
  styleUrls: ["./bottom-sheet.component.scss"],
})
export class BottomSheetComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = "";

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex > event.currentIndex) {
      // panel was opened (moved up)
      this.isOpen = true;
    } else if (event.previousIndex < event.currentIndex) {
      // panel was closed (moved down)
      this.isOpen = false;
    }
  }
}
