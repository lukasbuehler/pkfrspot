import { Component, Input } from "@angular/core";
import { ContributedMedia } from "src/scripts/db/Interfaces";

@Component({
  selector: "app-img-carousel",
  standalone: true,
  imports: [],
  templateUrl: "./img-carousel.component.html",
  styleUrl: "./img-carousel.component.scss",
})
export class ImgCarouselComponent {
  @Input() media: ContributedMedia[];
}
