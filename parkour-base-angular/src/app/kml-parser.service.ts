import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Spot } from "src/scripts/db/Spot";

import { parseString } from "xml2js";

export interface KMLSetupInfo {
  name?: string;
  description?: string;
  spotCount: number;
  folders: { name: string; spotCount: number }[];
}

export interface KMLSpots {
  spots: {
    spot: Spot.Schema;
    kmlFolder?: string;
    language: string;
    possibleDuplicateOf: Spot.Class[];
  }[];
}

@Injectable({
  providedIn: "root",
})
export class KmlParserService {
  constructor() {}

  private _parsedKml: any = {};

  parseKMLString$(kmlString: string): Observable<void> {
    return new Observable<void>((subscriber) => {
      this.parseKMLStringAsXML$(kmlString).subscribe(
        (xmlObj) => {
          this._parsedKml = xmlObj;
          subscriber.next(); // parsing was successful
          console.log(xmlObj);
        },
        (error) => {
          subscriber.error("Error on parsing KML string as XML");
          subscriber.error(error);
        }
      );
    });
  }

  getKMLPreviewInfo(): Observable<KMLSetupInfo> {
    return new Observable<KMLSetupInfo>((subscriber) => {
      if (!this._parsedKml) {
        subscriber.error(
          "There is no parsed KML available! You have to parse it first"
        );
      }

      let setupInfo: KMLSetupInfo = {
        name: "Unnamed KML",
        description: "",
        spotCount: 0,
        folders: [],
      };

      let document = this._parsedKml.kml?.Document[0];
      if (!document) {
        subscriber.error(
          "KML file is invalid! No Document in parsed KML found."
        );
      }

      // name
      setupInfo.name = document.name[0] || "Unnamed KML";

      // descripton
      setupInfo.description = document.description[0] || "";

      // spot count
      document.Folder.forEach((folder) => {
        setupInfo.spotCount += folder.Placemark.length;
      });

      // setFolders
      let folders = document.Folder.map((obj) => {
        let name = obj.name[0] || "Unnamed folder";
        let spotCount = obj.Placemark?.length || 0;
        return { name: name, spotCount: spotCount };
      });
      setupInfo.folders = folders;

      subscriber.next(setupInfo);
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

  //private makeSpotsFromParsedData$(): Observable<Spot.Schema> {}

  //private nameReplaceRegex(nameString: string, regex: RegExp): string {}

  /*
  private findPossibleDuplicatesForSpotSchema$(
    spotSchema: Spot.Schema
  ): Observable<Spot.Class[]> {}*/
}
