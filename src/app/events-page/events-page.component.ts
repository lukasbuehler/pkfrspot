import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: "app-events-page",
  imports: [NgOptimizedImage, MatCardModule],
  templateUrl: "./events-page.component.html",
  styleUrl: "./events-page.component.scss",
})
export class EventsPageComponent {}
