import { Injectable } from "@angular/core";
import { SearchClient } from "typesense";
import { SearchParams } from "typesense/lib/Typesense/Documents";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class SearchService {
  constructor() {}

  private readonly client: SearchClient = new SearchClient({
    nodes: [
      {
        host: environment.keys.typesense.host,
        port: 443,
        protocol: "https",
      },
    ],
    apiKey: environment.keys.typesense.api_key,
  });

  spotSearchParameters = {
    query_by:
      "description.de_CH,description.en_GB,name.de_CH,name.de_DE,name.en_US",
    sort_by: "_text_match:desc",
    per_page: 10,
    page: 1,
  };

  public async searchSpots(query: string) {
    let searchParams: SearchParams = { ...this.spotSearchParameters, q: query };

    const searchResults = await this.client
      .collections("spots")
      .documents()
      .search(searchParams, {});
    return searchResults;
  }
}
