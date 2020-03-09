import { Injectable } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/storage";
import * as firebase from "firebase/app";

@Injectable({
  providedIn: "root"
})
export enum StorageFolders {
  PostMedia = "post_media",
  ProfileImages = "profile_images"
}

export class StorageService {
  constructor() {}

  storageRef = firebase.storage().ref();

  getStoredContent() {}

  uploadToStorage(file: File, location: StorageFolders): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let filename = "test";
      let uploadRef = this.storageRef.child(`${location}/${filename}`);

      let uploadTask = uploadRef.put(file);
    });
  }
}
