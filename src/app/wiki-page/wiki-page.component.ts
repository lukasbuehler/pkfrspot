import { Component, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
    selector: 'app-wiki-page',
    templateUrl: './wiki-page.component.html',
    styleUrls: ['./wiki-page.component.scss'],
    standalone: true,
    imports: [PageHeaderComponent]
})
export class WikiPageComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
