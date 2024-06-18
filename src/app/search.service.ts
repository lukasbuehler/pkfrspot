import { Injectable } from "@angular/core";
import { SearchClient } from "typesense";
import { SearchParams } from "typesense/lib/Typesense/Documents";
import { environment } from "../environments/environment";
import { MapsApiService } from "./maps-api.service";

@Injectable({
  providedIn: "root",
})
export class SearchService {
  constructor(private _mapsService: MapsApiService) {}

  private readonly client: SearchClient = new SearchClient({
    nodes: [
      {
        host: environment.keys.typesense.host,
        port: 443,
        protocol: "https",
      },
    ],
    apiKey: environment.keys.typesense.apiKey,
  });

  spotSearchParameters = {
    query_by:
      "description.de_CH,description.en_GB,name.de_CH,name.de_DE,name.en_US",
    sort_by: "_text_match:desc",
    per_page: 10,
    page: 1,
  };

  public async searchSpotsAndGeocodePlaces(query: string) {
    let searchParams: SearchParams = { ...this.spotSearchParameters, q: query };

    const typesenseSpotSearchResults = this.client
      .collections("spots")
      .documents()
      .search(searchParams, {});

    const googlePlacesSearchResults = this._mapsService.autocompletePlaceSearch(
      query,
      ["geocode"]
    );

    const bothResults = await Promise.allSettled([
      typesenseSpotSearchResults,
      googlePlacesSearchResults,
    ]);

    console.log("bothResults:", bothResults);

    if (bothResults[0].status === "rejected") {
      console.error("typesense error:", bothResults[0].reason);
    }

    if (bothResults[1].status === "rejected") {
      console.error(
        "google maps places autocomplete API error:",
        bothResults[1].reason
      );
    }

    return {
      spots:
        bothResults[0].status === "fulfilled" ? bothResults[0].value : null,
      places:
        bothResults[1].status === "fulfilled" ? bothResults[1].value : null,
    };
  }
}
