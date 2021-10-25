import { Injectable } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/storage";
import * as firebase from "firebase/app";
import { Observable } from "rxjs";
import { generateUUID } from "src/scripts/Helpers";

export enum StorageFolder {
  PostMedia = "post_media",
  ProfilePictures = "profile_pictures",
  SpotPictures = "spot_pictures",
}

@Injectable({
  providedIn: "root",
})
export class StorageService {
  constructor() {}

  storageRef = firebase.default.storage().ref();
  uploadObs: Observable<string> = null;

  getStoredContent() {}

  /**
   * Uploads a file or blob to a specified locatin in cloud storage
   * @param blob
   * @param location
   * @param filename
   * @returns Observable which sends the download URL as soon as the upload is completed
   */
  setUploadToStorage(
    blob: Blob,
    location: StorageFolder,
    filename?: string
  ): Observable<string> {
    this.uploadObs = new Observable<string>((subscriber) => {
      let uploadFileName = filename || generateUUID();
      let uploadRef = this.storageRef.child(`${location}/${uploadFileName}`);

      let uploadTask = uploadRef.put(blob);

      uploadTask.on(
        firebase.default.storage.TaskEvent.STATE_CHANGED,
        (snapshot) => {},
        (error) => {
          subscriber.error(error);
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
            console.log("File available at", downloadURL);
            subscriber.next(downloadURL);
          });
        }
      );
    });
    return this.uploadObs;
  }

  deleteFromStorage(location: StorageFolder, filename: string): Promise<void> {
    return this.storageRef.child(`${location}/${filename}`).delete();
  }

  upload(): Observable<string> {
    return this.uploadObs;
  }
}
