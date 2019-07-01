import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { map_style } from "./map_style"

import { } from "googlemaps"
import { DatabaseService } from '../database.service';
import { LatLngLiteral, AgmMap, AgmPolygon, PolygonManager } from '@agm/core';
import { MapStyle } from 'src/scripts/MapStyle';
import { Spot } from 'src/scripts/db/Spot';

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
  spotPolygons: AgmPolygon[] = []

  editing: boolean = false;
  selectedSpot: Spot.Class = null;
  editingPaths: Array<Array<LatLngLiteral>> = [];

  droppedMarkerLocation = null;

  start_coordinates = {
    lat: 47.206796,
    lng: 8.794528
  }

  spots: Spot.Class[] = [];

  constructor(private _dbService: DatabaseService)
  { }

  clickedMap(coords) {
    console.log(coords);
    this.droppedMarkerLocation = coords.coords;
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

  clickedSpot(spot: Spot.Class) {
    this.selectedSpot = spot;
    this.editingPaths = spot.paths
  }

  saveBoundsEdit()
  {
    this.selectedSpot.paths = this.editingPaths;
    this._dbService.setSpot(this.selectedSpot).subscribe(
      value => {
        console.log("Successful save!")
        console.log(value);

        this.editing = false;
      },
      error => {
        console.error(error);
      },
      () => {}
    )
  }

  pathsChanged(pathsChangedEvent)
  {
    console.log(pathsChangedEvent)

    this.editingPaths = pathsChangedEvent.newArr;
  }

  ngOnInit()
  {
    this._dbService.getTestSpots().subscribe(
      data =>
      {
        this.spots = this.spots.concat(data);
      },
      error =>
      {
        console.error(error);
      },
      () => { } // complete 
    );
  }
}
