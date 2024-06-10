import { Component, HostBinding, Input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { RouterLinkActive, RouterLink } from "@angular/router";

@Component({
  selector: "app-mat3-nav-button",
  templateUrl: "./mat3-nav-button.component.html",
  styleUrls: ["./mat3-nav-button.component.scss"],
  standalone: true,
  imports: [RouterLinkActive, RouterLink, MatIcon],
})
export class Mat3NavButtonComponent {
  @Input() icon: string = "info";
  @Input() label: string = "label";
  @Input() routerLink: string = "/";

  @HostBinding("attr.tabindex") tabindex = -1;
}
