import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit
{

  constructor() { }

  ngOnInit()
  {
  }

  posts = [
    {
      title: "Doggo 1",
      username: "Shiiiiba",
      image_src: "https://material.angular.io/assets/img/examples/shiba2.jpg",
      text: "Wuff"
    },
    {
      title: "Doggo 1",
      username: "Shiiiiba",
      image_src: "https://material.angular.io/assets/img/examples/shiba2.jpg",
      text: "Wuff"
    },
    {
      title: "Doggo 1",
      username: "Shiiiiba",
      image_src: "https://material.angular.io/assets/img/examples/shiba2.jpg",
      text: "Wuff"
    },
    {
      title: "Doggo 1",
      username: "Shiiiiba",
      image_src: "https://material.angular.io/assets/img/examples/shiba2.jpg",
      text: "Wuff"
    }
  ]
}
