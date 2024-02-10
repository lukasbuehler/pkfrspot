import { Injectable } from "@angular/core";
import firebase from "firebase/compat";
import { Observable } from "rxjs";
import { Spot } from "src/scripts/db/Spot";

import { parseString } from "xml2js";

export interface KMLSetupInfo {
  name?: string;
  description?: string;
  spotCount: number;
  folders: { name: string; spotCount: number }[];
}

export interface KMLSpot {
  spot: {
    name: string;
    location: google.maps.LatLngLiteral;
  };
  kmlFolder?: string;
  language: string;
  possibleDuplicateOf: Spot.Class[];
}

@Injectable({
  providedIn: "root",
})
export class KmlParserService {
  constructor() {}

  private _parsingWasSuccessful: boolean = false;
  get parsingWasSuccessful() {
    return this._parsingWasSuccessful;
  }

  private _info: KMLSetupInfo | null;
  get info(): KMLSetupInfo | null {
    return this._info;
  }

  private _spotFolders: { [key: number]: KMLSpot[] } | null = null;

  private _parsedKml: any | null = null;

  parseKMLFromString$(kmlString: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._parseKMLStringAsXML$(kmlString).then(
        (xmlObj) => {
          this._parsedKml = xmlObj;
          if (!this._parsedKml) {
            reject("The parsed KML object is null. This should not happen.");
            return;
          }

          this._info = {
            name: "Unnamed KML",
            description: "",
            spotCount: 0,
            folders: [],
          };

          this._spotFolders = {};

          let doc = this._parsedKml.kml?.Document[0];

          if (!doc) {
            reject("KML file is invalid! No Document in parsed KML found.");
            return;
          }

          // name
          this._info.name = doc.name[0] || "Unnamed KML";
          this._info.description = doc.description[0] || "";

          // set spot count
          if (!doc.Folder) {
            console.error("No folders found in KML file");
          }
          doc.Folder.forEach((folder, folderIndex) => {
            let numberOfSpotsinFolder: number = folder?.Placemark?.length ?? 0;
            this._info.spotCount += numberOfSpotsinFolder;

            // add the folder name to the folders.
            this._info.folders.push({
              name: folder.name[0] || "Unnamed folder",
              spotCount: numberOfSpotsinFolder,
            });

            // load the spots from the folder.
            let kmlSpots: KMLSpot[] = folder.Placemark.map((placemark) => {
              const regex = /(-?\d+\.\d+),(-?\d+\.\d+)/;
              const matches = placemark.Point[0].coordinates[0].match(regex);

              const spot: KMLSpot["spot"] = {
                name: placemark.name[0] || "Unnamed spot",
                location: {
                  lat: matches[1],
                  lng: matches[2],
                },
              };

              let kmlSpot: KMLSpot = {
                spot: spot,
                kmlFolder: folder.name[0] || "Unnamed folder",
                language: "en",
                possibleDuplicateOf: [], // TOOD: find duplicates
              };

              return kmlSpot;
            });
            this._spotFolders[folderIndex] = kmlSpots;
          });

          console.log(this._spotFolders);

          // parsing was successful
          this._parsingWasSuccessful = true;
          resolve();
        },
        (error) => {
          console.error("Error on parsing KML string as XML");
          reject(error);
        }
      );
    });
  }

  /**
   * Parse the KML data string using an XML parser and return the JS element containing the XML data.
   * @param kmlString The XML string from the KML file
   * @returns Returns a promise that resolves with the KML object or rejects with an error.
   */
  private _parseKMLStringAsXML$(kmlString: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      parseString(kmlString, (err, result) => {
        if (!err) {
          resolve(result);
        } else {
          reject(err);
        }
      });
    });
  }

  //private nameReplaceRegex(nameString: string, regex: RegExp): string {}

  /*
  private findPossibleDuplicatesForSpotSchema$(
    spotSchema: Spot.Schema
  ): Observable<Spot.Class[]> {}*/
}
