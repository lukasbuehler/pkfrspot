import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { keys } from "../../environments/keys"

import { } from "googlemaps"
import { DatabaseService } from '../database.service';
import { LatLngLiteral } from '@agm/core';

@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss']
})
export class MapPageComponent implements OnInit
{
  start_coordinates = {
    lat: 47.206796,
    lng: 8.794528
  }

  spots: any[] = [];
  paths: Array<LatLngLiteral> = [];

  constructor(private _dbService: DatabaseService)
  { }

  clickedMap(event) {
    console.log(event);
  }

  clickedSpot(event) {
    console.log(event);
  }


  ngOnInit()
  {
    this._dbService.getTestSpots().subscribe(
      data =>
      {
        console.log(data);

        this.spots = this.spots.concat(data);

        this.paths = [];
        for(let spot of this.spots)
        { 
          for(let point of spot.bounds)
          {
            this.paths.push({ lat: point._lat, lng: point._long})
          }
        }
        
      },
      error =>
      {
        console.error(error);
      },
      () => { } // complete 
    );
  }
}
