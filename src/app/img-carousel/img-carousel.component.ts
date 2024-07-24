import {
  AfterViewInit,
  Component,
  Input,
  Renderer2,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
} from "@angular/core";
import { ContributedMedia } from "../../scripts/db/Interfaces";
import { MatRippleModule } from "@angular/material/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from "@angular/material/dialog";
import { StorageService } from "../storage.service";

// Swiper
import Swiper from "swiper";
import { Navigation, Pagination } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";
import { isPlatformBrowser } from "@angular/common";

@Component({
  selector: "app-img-carousel",
  standalone: true,
  imports: [MatRippleModule],
  templateUrl: "./img-carousel.component.html",
  styleUrl: "./img-carousel.component.scss",
})
export class ImgCarouselComponent {
  @Input() media: ContributedMedia[];

  constructor(
    public dialog: MatDialog,
    public storageService: StorageService
  ) {}

  imageClick(index: number) {
    this.openImageViewer(index);
  }

  openImageViewer(index: number = 0) {
    const dialogRef = this.dialog.open(SwiperDialogComponent, {
      data: { media: this.media, index: index },
      hasBackdrop: true,
      maxWidth: "95vw",
      maxHeight: "75vh",
    });

    // dialogRef.afterClosed().subscribe((result) => {
    //   console.log("The dialog was closed");
    // });
  }
}

@Component({
  selector: "swiper-dialog",
  template: `
    <div id="swiper" class="swiper">
      <div class="swiper-wrapper">
        @for (mediaObj of data.media; track $index) { @if(mediaObj.type ===
        'image') {
        <div class="swiper-slide"><img src="{{ mediaObj.src }}" /></div>
        } }
      </div>
      <!-- pagination -->
      <div class="swiper-pagination"></div>

      <!-- navigation buttons -->
      <div class="swiper-button-prev"></div>
      <div class="swiper-button-next"></div>

      <!-- scrollbar -->
      <div class="swiper-scrollbar"></div>
    </div>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  styles: [
    `
      :host {
        display: flex;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SwiperDialogComponent implements AfterViewInit {
  swiper: Swiper = null;
  isBroswer: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<SwiperDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(PLATFORM_ID) platformId: Object,
    public storageService: StorageService
  ) {
    dialogRef.disableClose = false;

    this.isBroswer = isPlatformBrowser(platformId);
  }

  ngAfterViewInit() {
    if (this.isBroswer) {
      // const swiperContainer = document.querySelector(".swiper");
      this.swiper = new Swiper(".swiper", {
        // configure Swiper to use modules
        // modules: [Navigation, Pagination],

        // Optional parameters
        direction: "horizontal",
        loop: false,
        observer: true,
        observeParents: true,
        autoplay: false,

        // If we need pagination
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
          dynamicBullets: true,
        },

        // Navigation arrows
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
          enabled: true,
        },

        // scrollbar
        scrollbar: {
          el: ".swiper-scrollbar",
        },
      });

      //   this.renderer.listen(swiperContainer, "touchstart", (event) => {
      //     event.stopPropagation();
      //   });
      //   this.renderer.listen(swiperContainer, "touchmove", (event) => {
      //     event.stopPropagation();
      //   });

      if (this.data.index && this.swiper) {
        const what: boolean = this.swiper.slideTo(this.data.index, 1, false);
        console.log(what);
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
