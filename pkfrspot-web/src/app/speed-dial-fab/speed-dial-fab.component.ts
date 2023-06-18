import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { speedDialFabAnimations } from "./speed-dial-fab.animations";

export interface SpeedDialFabButtonConfig {
  mainButton?: {
    icon?: string;
    tooltip?: string;
    color?: string;
  };
  miniButtonColor: string;
  tooltipPosition?: string;
  miniButtons: {
    icon: string;
    tooltip?: string;
  }[];
}

@Component({
  selector: "app-speed-dial-fab",
  templateUrl: "./speed-dial-fab.component.html",
  styleUrls: ["./speed-dial-fab.component.scss"],
  animations: speedDialFabAnimations,
})
export class SpeedDialFabComponent implements OnInit {
  @ViewChild("fabContainer") fabContainer: ElementRef;
  @Input("buttonConfig") buttonConfig: SpeedDialFabButtonConfig;
  @Input("rotationDegrees") rotationDegrees: number = 45;
  @Input("openOnHover") openOnHover: boolean = false;

  @Output("mainFabClick")
  mainFabClick: EventEmitter<void> = new EventEmitter<void>();
  @Output("miniFabClick")
  miniFabClick: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Whether the speed dial is open or closed.
   * Default is closed.
   */
  isOpen: boolean = false;

  @HostListener("document:click", ["$event.target"])
  public onClick(target) {
    const clickedInside = this.fabContainer.nativeElement.contains(target);
    if (!clickedInside) {
      // this click event from outside
      this.onClickOutside();
    }
  }

  constructor() {}

  ngOnInit(): void {}

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  onMainClick() {
    if (this.openOnHover && this.isOpen) {
      // call the action function provided for the mainButton
      this.mainFabClick.emit();
    } else {
      if (!this.isOpen) {
        this.open();
      } else {
        this.toggle();
      }
    }
  }

  onMouseEnter() {
    // open the fab button if it is configured to
    if (this.openOnHover) {
      this.open();
    }
  }

  onMouseLeave() {
    // we want to close it anyhow
    if (this.openOnHover) {
      this.close();
    }
  }

  onClickOutside() {
    this.close();
  }

  miniButtonClick(index: number) {
    this.miniFabClick.emit(index);
  }
}
