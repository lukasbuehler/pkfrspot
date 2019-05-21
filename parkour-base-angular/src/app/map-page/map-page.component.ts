import { Component, OnInit } from '@angular/core';
import { environment } from "../../environments/environment"

@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss']
})
export class MapPageComponent implements OnInit {

  loadAPI: Promise<any>;

  google_maps_api_key: string = environment.keys.google_maps;

  constructor()
  {
    this.loadAPI = new Promise((resolve) =>
    {
      this.loadScript();
      resolve(true);
    });
  }

  ngOnInit()
  {
  }

  public loadScript()
  {
    var isFound = false;
    var scripts = document.getElementsByTagName("script")
    for (var i = 0; i < scripts.length; ++i)
    {
      if (scripts[i].getAttribute('src') != null && scripts[i].getAttribute('src').includes("loader"))
      {
        isFound = true;
      }
    }

    if (!isFound)
    {
      var dynamicScripts = ["https://maps.googleapis.com/maps/api/js?key="+this.google_maps_api_key+"&callback=initMap"];

      for (var i = 0; i < dynamicScripts.length; i++)
      {
        let node = document.createElement('script');
        node.src = dynamicScripts[i];
        node.type = 'text/javascript';
        node.async = true;
        node.defer = true;
        document.getElementsByTagName('head')[0].appendChild(node);
      }

    }
  }

}
