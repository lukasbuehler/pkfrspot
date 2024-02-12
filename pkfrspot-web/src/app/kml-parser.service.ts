import { Injectable } from "@angular/core";
import firebase from "firebase/compat";
import { BehaviorSubject, Observable } from "rxjs";
import { Spot } from "src/scripts/db/Spot";

import { parseString } from "xml2js";

export interface KMLSetupInfo {
  name?: string;
  lang?: string;
  description?: string;
  spotCount: number;
  folders: { name: string; spotCount: number; import: boolean }[];
}

export interface KMLSpot {
  spot: {
    name: string;
    location: google.maps.LatLngLiteral;
  };
  folder?: string;
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

  public setupInfo: KMLSetupInfo | null;

  public foldersToImport: number[] = [];

  private _spotFolders: { [key: number]: KMLSpot[] } | null = null;

  private _spotsToImport$ = new BehaviorSubject<KMLSpot[]>([]);
  public spotsToImport$: Observable<KMLSpot[]> = this._spotsToImport$;

  private _spotsNotToImport$ = new BehaviorSubject<KMLSpot[]>([]);
  public spotsNotToImport$: Observable<KMLSpot[]> = this._spotsNotToImport$;

  private _parsedKml: any | null = null;

  parseKMLFromString(kmlString: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._parseKMLStringAsXML$(kmlString).then(
        (xmlObj) => {
          this._parsedKml = xmlObj;
          if (!this._parsedKml) {
            reject("The parsed KML object is null. This should not happen.");
            return;
          }

          this.setupInfo = {
            name: "Unnamed KML",
            description: "",
            spotCount: 0,
            lang: "",
            folders: [],
          };

          this._spotFolders = {};

          let doc = this._parsedKml.kml?.Document[0];

          if (!doc) {
            reject("KML file is invalid! No Document in parsed KML found.");
            return;
          }

          // name
          this.setupInfo.name = doc.name[0] || "Unnamed KML";
          this.setupInfo.description = doc.description[0] || "";

          // set spot count
          if (!doc.Folder) {
            console.error("No folders found in KML file");
          }
          doc.Folder.forEach((folder, folderIndex) => {
            let numberOfSpotsinFolder: number = folder?.Placemark?.length ?? 0;
            this.setupInfo.spotCount += numberOfSpotsinFolder;

            // add the folder name to the folders.
            this.setupInfo.folders.push({
              name: folder.name[0] || "Unnamed folder",
              spotCount: numberOfSpotsinFolder,
              import: true,
            });

            // load the spots from the folder.
            let kmlSpots: KMLSpot[] = folder.Placemark.map((placemark) => {
              const regex = /(-?\d+\.\d+),(-?\d+\.\d+)/;
              const matches = placemark.Point[0].coordinates[0].match(regex);

              const spot: KMLSpot["spot"] = {
                name: placemark.name[0] || "Unnamed spot",
                location: {
                  lat: parseFloat(matches[2]),
                  lng: parseFloat(matches[1]),
                },
              };

              let kmlSpot: KMLSpot = {
                spot: spot,
                folder: folder.name[0] || "Unnamed folder",
                language: "en",
                possibleDuplicateOf: [], // TOOD: find duplicates
              };

              return kmlSpot;
            });
            this._spotFolders[folderIndex] = kmlSpots;
          });

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

  confirmSetup() {
    // set the spots to import and not to import using the folders to import
    let spotsToImport: KMLSpot[] = [];
    let spotsNotToImport: KMLSpot[] = [];

    console.log(this.setupInfo.folders);

    this.setupInfo.folders.forEach((folder, folderIndex) => {
      let spotsInFolder = this._spotFolders[folderIndex];
      if (folder.import) {
        // apply the name regex to all spots in the folder
        // TODO

        spotsToImport = spotsToImport.concat(spotsInFolder);
      } else {
        spotsNotToImport = spotsNotToImport.concat(spotsInFolder);
      }
    });

    this._spotsToImport$.next(spotsToImport);
    this._spotsNotToImport$.next(spotsNotToImport);

    console.log(this._spotsToImport$.value);
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
