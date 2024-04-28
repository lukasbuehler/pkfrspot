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
    let lastY = 0;
    let speed = 0;
    let height = this.bottomSheet.nativeElement.clientHeight;
    let alwaysVisibleHeight = height - this.headerHeight;

    let topHeightOffset = 0;
    let middleHeightOffset = alwaysVisibleHeight / 2;
    let bottomHeightOffset = alwaysVisibleHeight;

    this.renderer.listen(
      this.bottomSheet.nativeElement,
      "dragstart",
      (event) => {
        event.preventDefault();
      }
    );

    const startDrag = (event) => {
      event.preventDefault();

      let clientY =
        event.type === "touchstart" ? event.touches[0].clientY : event.clientY;
      let shiftY = clientY - this.bottomSheet.nativeElement.offsetTop;

      const moveAt = (event) => {
        let pageY =
          event.type === "touchmove" ? event.touches[0].pageY : event.pageY;
        let newTop = pageY - shiftY;

        // Calculate speed
        speed = pageY - lastY;
        lastY = pageY;

        if (newTop < 0) newTop = 0;
        if (newTop > alwaysVisibleHeight) newTop = alwaysVisibleHeight;

        this.bottomSheet.nativeElement.style.top = newTop + "px";
      };

      const mouseMoveListener = this.renderer.listen(
        "document",
        "mousemove",
        moveAt
      );
      const touchMoveListener = this.renderer.listen(
        "document",
        "touchmove",
        moveAt
      );

      const stopDrag = () => {
        mouseMoveListener();
        touchMoveListener();

        let targetOffset = 0;

        // Limit the target position
        if (speed < 0) targetOffset = topHeightOffset;
        if (speed >= 0) targetOffset = bottomHeightOffset;

        // Calculate the distance to the target position
        let startOffset = this.bottomSheet.nativeElement.offsetTop;
        let distance = targetOffset - startOffset;

        // Start the easing
        let start = null;
        const step = (timestamp) => {
          if (!start) start = timestamp;
          let progress = timestamp - start;

          //   console.log("progress", progress);
          //   console.log("startOffset", startOffset);
          //   console.log("distance", distance);

          // Calculate the current position
          let current = this.easeOutCubic(progress, startOffset, distance, 500);

          this.bottomSheet.nativeElement.style.top = current + "px";

          // Continue the easing if not at the target position
          if (progress < 500) {
            window.requestAnimationFrame(step);
          }
        };
        window.requestAnimationFrame(step);
      };

      this.renderer.listen("document", "mouseup", stopDrag);
      this.renderer.listen("document", "touchend", stopDrag);
      this.renderer.listen("document", "mouseleave", stopDrag);
      this.renderer.listen("window", "blur", stopDrag);
    };

    this.renderer.listen(
      this.bottomSheet.nativeElement,
      "mousedown",
      startDrag
    );
    this.renderer.listen(
      this.bottomSheet.nativeElement,
      "touchstart",
      startDrag
    );
  }

  easeOutCubic(t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  }
}
