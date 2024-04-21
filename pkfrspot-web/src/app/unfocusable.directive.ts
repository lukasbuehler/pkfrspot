import { Directive, ElementRef, Renderer2 } from "@angular/core";

@Directive({
  selector: "[appUnfocusable]",
})
export class UnfocusableDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.renderer.setAttribute(this.el.nativeElement, "tabindex", "-1");
  }
}
