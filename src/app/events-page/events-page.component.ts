import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-events-page",
  imports: [NgOptimizedImage, MatCardModule, RouterLink],
  templateUrl: "./events-page.component.html",
  styleUrl: "./events-page.component.scss",
})
export class EventsPageComponent {}
