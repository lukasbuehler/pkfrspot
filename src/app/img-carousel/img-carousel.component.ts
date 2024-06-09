import {
  AfterViewInit,
  Component,
  Input,
  Renderer2,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { ContributedMedia } from "../../scripts/db/Interfaces";
import { MatRippleModule } from "@angular/material/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import SwiperCore, { Navigation, Pagination } from "swiper";
import { StorageService } from "../storage.service";
SwiperCore.use([Navigation, Pagination]);

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
    });

    // dialogRef.afterClosed().subscribe((result) => {
    //   console.log("The dialog was closed");
    // });
  }
}

@Component({
  selector: "swiper-dialog",
  template: `
    <swiper-container
      #swiperRef
      zoom-max-ratio="3"
      zoom-min-ratio="1"
      [navigation]="true"
      [pagination]="{ clickable: true }"
    >
      @for (mediaObj of data.media; track $index) { @if(mediaObj.type ===
      'image') {
      <swiper-slide><img src="{{ mediaObj.src }}" /> </swiper-slide>} }
    </swiper-container>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  styles: [
    `
      :host {
        display: flex;
      }
      swiper-container {
        max-height: 95vh;
        max-width: 95vw;
      }
      swiper-slide {
        display: flex;
        flex-direction: column;
        justify-content: center;
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
  @ViewChild("swiperRef") swiperRef: ElementRef | undefined;

  constructor(
    public dialogRef: MatDialogRef<SwiperDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private renderer: Renderer2,
    public storageService: StorageService
  ) {
    dialogRef.disableClose = false;
  }

  ngAfterViewInit() {
    const swiperContainer = document.querySelector("swiper-container");
    if (swiperContainer) {
      this.renderer.listen(swiperContainer, "touchstart", (event) => {
        event.stopPropagation();
      });
      this.renderer.listen(swiperContainer, "touchmove", (event) => {
        event.stopPropagation();
      });

      if (this.data.index && this.swiperRef) {
        this.swiperRef?.nativeElement.swiper.slideTo(this.data.index);
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
