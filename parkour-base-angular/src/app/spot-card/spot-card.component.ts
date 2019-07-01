import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Spot } from 'src/scripts/db/Spot';

@Component({
  selector: 'app-spot-card',
  templateUrl: './spot-card.component.html',
  styleUrls: ['./spot-card.component.scss']
})
export class SpotCardComponent implements OnInit {

  @Input() spot: Spot.Class;
  @Input() preview: boolean = false;
  @Input() dismissable: boolean = false;
  @Input() flat: boolean = false;
  @Input() clickable: boolean = false;

  @Output() dismiss: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();
  
  constructor() { }

  ngOnInit() {
  }

  dismissed() {
    this.dismiss.emit(true);
  }

  editRequested() {
    this.edit.emit();
  }
}
