import { Component, OnInit, ViewChild } from '@angular/core';
import { keys } from "../../environments/keys"

import { } from "googlemaps"

@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss']
})
export class MapPageComponent implements OnInit {

  google_maps_api_key: string = keys.google_maps;

  @ViewChild("map") mapElement: any;
  map: google.maps.Map;

  constructor()
  {
  }

  ngOnInit()
  {
    var mapProp = {
      center: new google.maps.LatLng(-34.397, 150.644),
      zoom: 8,
      mapTypeId: google.maps.MapTypeId.SATELLITE
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapProp);
    /*
    <!-- Script for the Google Maps API -->
    <script>
      function initMap()
      {
        new google.maps.Map(document.getElementById('map'), {
          center: { lat: -34.397, lng: 150.644 },
          zoom: 8
        });
      }
     */
  }
}
