import {
  Component,
  ElementRef,
  Input,
  Renderer2,
  ViewChild,
} from "@angular/core";

@Component({
  selector: "app-bottom-sheet",
  templateUrl: "./bottom-sheet.component.html",
  styleUrls: ["./bottom-sheet.component.scss"],
})
export class BottomSheetComponent {
  @Input() title: string = "";

  @Input() hasHeader: boolean = true;

  headerHeight: number = 102;

  @ViewChild("bottomSheet", { static: true }) bottomSheet: ElementRef;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.renderer.listen(
      this.bottomSheet.nativeElement,
      "dragstart",
      (event) => {
        event.preventDefault();
      }
    );

    this.renderer.listen(
      this.bottomSheet.nativeElement,
      "mousedown",
      (event) => {
        event.preventDefault();

        let shiftY = event.clientY - this.bottomSheet.nativeElement.offsetTop;

        // this.bottomSheet.nativeElement.style.position = "absolute";

        const mouseMoveListener = this.renderer.listen(
          "document",
          "mousemove",
          (event) => {
            let newTop = event.pageY - shiftY;

            if (newTop < 0) newTop = 0;
            if (
              newTop >
              this.bottomSheet.nativeElement.clientHeight - this.headerHeight
            )
              newTop =
                this.bottomSheet.nativeElement.clientHeight - this.headerHeight;

            this.bottomSheet.nativeElement.style.top = newTop + "px";
          }
        );

        const stopDrag = () => {
          mouseMoveListener();
        };

        this.renderer.listen(
          this.bottomSheet.nativeElement,
          "mouseup",
          stopDrag
        );
        this.renderer.listen("document", "mouseleave", stopDrag);
        this.renderer.listen("window", "blur", stopDrag);
      }
    );
  }
}
