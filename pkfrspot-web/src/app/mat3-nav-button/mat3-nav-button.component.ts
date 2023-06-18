import { Component, Input } from "@angular/core";

@Component({
  selector: "app-mat3-nav-button",
  templateUrl: "./mat3-nav-button.component.html",
  styleUrls: ["./mat3-nav-button.component.scss"],
})
export class Mat3NavButtonComponent {
  @Input() icon: string;
  @Input() label: string;
  @Input() routerLink: string;
}
