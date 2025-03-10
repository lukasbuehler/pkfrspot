import { NgClass } from "@angular/common";
import { Component, ElementRef, inject, input } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

export interface MarkerSchema {
  name?: string;
  color?: "primary" | "secondary" | "tertiary";
  location: google.maps.LatLngLiteral;
  icon?: string;
  number?: number;
  priority?: "required" | number;
}

@Component({
  selector: "app-marker",
  imports: [MatIconModule, NgClass],
  templateUrl: "./marker.component.html",
  styleUrl: "./marker.component.scss",
})
export class MarkerComponent {
  public elementRef = inject(ElementRef);

  icon = input<string | null | undefined>(null);
  number = input<number | null | undefined>(null);
  isIconic = input<boolean>(false);
  color = input<"primary" | "secondary" | "tertiary">("primary");
  size = input<number>(1);
}
