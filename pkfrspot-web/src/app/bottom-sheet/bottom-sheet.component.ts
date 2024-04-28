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

    let animationSteps = 500;

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
      // Only start the drag when the sheet is at the top if the user is
      // dragging on the header. Otherwise, the user might be trying to
      // scroll the content.
      let headerElement =
        this.bottomSheet.nativeElement.querySelector(".header");

      // Check if the event target is the header element or a descendant of it
      let isHeaderOrChild = headerElement.contains(event.target);

      if (
        // this.bottomSheet.nativeElement.offsetTop === 0 &&
        !isHeaderOrChild
      ) {
        return;
      }

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

          // Calculate the current position
          let current = this.easeOutCubic(
            progress,
            startOffset,
            distance,
            animationSteps
          );

          this.bottomSheet.nativeElement.style.top = current + "px";

          // Continue the easing if not at the target position
          if (progress < animationSteps) {
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
