import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-post-collection',
  templateUrl: './post-collection.component.html',
  styleUrls: ['./post-collection.component.scss']
})
export class PostCollectionComponent implements OnInit {

  @Input() posts: any[];
  
  @Input() title: string;

  constructor() { }

  ngOnInit() {
  }

}
