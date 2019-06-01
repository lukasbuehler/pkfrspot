import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { map_style } from "./map_style"

import { } from "googlemaps"
import { DatabaseService } from '../database.service';
import { LatLngLiteral, AgmMap } from '@agm/core';
import { MapStyle } from 'src/scripts/MapStyle';

@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss']
})
export class MapPageComponent implements OnInit
{

  @ViewChild('map') map: AgmMap;
  mapStyle: MapStyle = MapStyle.Simple;
  mapStylesConfig = map_style;

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

  toggleMapStyle() 
  {
    if(this.map.mapTypeId === MapStyle.Simple)
    {
      this.mapStyle = MapStyle.Satellite;
    }
    else
    {
      this.mapStyle = MapStyle.Simple;
    }
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
