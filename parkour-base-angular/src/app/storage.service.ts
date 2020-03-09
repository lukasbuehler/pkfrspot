import { Injectable } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/storage";
import * as firebase from "firebase/app";
import { Observable } from "rxjs";

export enum StorageFolders {
  PostMedia = "post_media",
  ProfileImages = "profile_images"
}

@Injectable({
  providedIn: "root"
})
export class StorageService {
  constructor() {}

  storageRef = firebase.storage().ref();
  uploadObs: Observable<string> = null;

  getStoredContent() {}

  setUploadToStorage(file: File, location: StorageFolders): Observable<string> {
    this.uploadObs = new Observable<string>(subscriber => {
      let filename = "test";
      let uploadRef = this.storageRef.child(`${location}/${filename}`);

      let uploadTask = uploadRef.put(file);

      uploadTask.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        snapshot => {},
        error => {
          subscriber.error(error);
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
            console.log("File available at", downloadURL);
            subscriber.next(downloadURL);
          });
        }
      );
    });
    return this.uploadObs;
  }

  upload(): Observable<string> {
    return this.uploadObs;
  }
}
