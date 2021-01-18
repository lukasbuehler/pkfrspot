import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Spot } from "src/scripts/db/Spot";

import { parseString } from "xml2js";

export interface KMLSpots {
  spots: {
    spot: Spot.Schema;
    kmlFolder: string;
    language: string;
    possibleDuplicateOf: Spot.Class[];
  }[];
}

@Injectable({
  providedIn: "root",
})
export class KmlParserService {
  constructor() {}

  parseKMLFile$() {}

  parseKMLString$(): Observable<KMLSpots> {
    return new Observable<KMLSpots>((subscriber) => {
      this.parseKMLStringAsXML$;
    });
  }

  /**
   * Parse the KML data string using an XML parser and return the JS element containing the XML data.
   * @param kmlString The XML string from the KML file
   */
  private parseKMLStringAsXML$(kmlString: string): Observable<any> {
    return new Observable<any>((subscriber) => {
      parseString(kmlString, (err, result) => {
        if (!err) {
          subscriber.next(result);
        } else {
          subscriber.error(err);
        }
      });
    });
  }

  private makeSpotsFromParsedData$(): Observable<Spot.Schema> {}

  private nameReplaceRegex(nameString: string, regex: RegExp): string {}

  private findPossibleDuplicatesForSpotSchema$(
    spotSchema: Spot.Schema
  ): Observable<Spot.Class[]> {}
}
