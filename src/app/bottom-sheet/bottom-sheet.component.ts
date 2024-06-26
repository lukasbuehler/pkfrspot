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
  standalone: true,
})
export class BottomSheetComponent {
  @Input() title: string = "";

  headerHeight: number = 120;

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

    const startDrag = (event) => {
      if (typeof window === "undefined") return; // abort if not in browser

      let lastY = 0;
      let speed = 0;
      let height = this.bottomSheet.nativeElement.clientHeight;
      let alwaysVisibleHeight = height - this.headerHeight;

      let animationSteps = 500;

      let topHeightOffset = 0;
      let middleHeightOffset = alwaysVisibleHeight / 2;
      let bottomHeightOffset = alwaysVisibleHeight;

      let isScrollableUp = false;
      let target = event.target;

      let isAtTop: boolean = this.bottomSheet.nativeElement.offsetTop === 0;

      if (isAtTop) {
        while (target) {
          if (target === this.bottomSheet.nativeElement) break;
          if (
            target.clientHeight !== 0 &&
            target.scrollHeight > target.clientHeight + 2
          ) {
            // the + 2 is for borders i assume, had to put it in

            // now check if a scrollable element is at the top
            const scrollOffsetToTop = target.scrollTop;

            if (scrollOffsetToTop !== 0) {
              isScrollableUp = true;
              break;
            }
          }
          target = target.parentElement;
        }
      } else {
        event.preventDefault();
      }

      let clientY =
        event.type === "touchstart" ? event.touches[0].clientY : event.clientY;
      let shiftY = clientY - this.bottomSheet.nativeElement.offsetTop;

      const moveAt = (event) => {
        let pageY =
          event.type === "touchmove" ? event.touches[0].pageY : event.pageY;

        const isScrollingUp = pageY - shiftY > 0;
        if (isScrollingUp && isScrollableUp) {
          // don't move the sheet when the user is scrolling up, and the content can scroll up
          return;
        }

        // Calculate speed
        speed = pageY - lastY;
        lastY = pageY;

        let newTop = pageY - shiftY;

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

      const stopDrag = (event) => {
        mouseMoveListener();
        touchMoveListener();

        let pageY =
          event.type === "touchend"
            ? event.changedTouches[0].pageY
            : event.pageY;

        // current target should be the current location
        let targetOffset = 0;

        if (Math.abs(speed) > 5) {
          // if we are here the user let go fast or far enough, so we set the
          // other point as the target now
          // Limit the target position
          if (speed >= -1) targetOffset = bottomHeightOffset;
          else targetOffset = topHeightOffset;
        }

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
      //   this.renderer.listen("document", "mouseleave", stopDrag);
      //   this.renderer.listen("window", "blur", stopDrag);
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
