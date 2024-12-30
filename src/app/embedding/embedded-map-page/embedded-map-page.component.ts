import { Component } from "@angular/core";
import { SpotMapComponent } from "../../spot-map/spot-map.component";

@Component({
  selector: "app-embedded-map-page",
  standalone: true,
  imports: [SpotMapComponent],
  templateUrl: "./embedded-map-page.component.html",
  styleUrl: "./embedded-map-page.component.scss",
})
export class EmbeddedMapPageComponent {}
