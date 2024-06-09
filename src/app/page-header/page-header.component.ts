import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss'],
    standalone: true
})
export class PageHeaderComponent implements OnInit {

  constructor() { }

  @Input("title") title: string;

  ngOnInit() {
  }

}
