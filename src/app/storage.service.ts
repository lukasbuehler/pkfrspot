import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { generateUUID } from "../scripts/Helpers";

import { getDownloadURL, getStorage } from "@angular/fire/storage";
import { deleteObject, ref, uploadBytes } from "firebase/storage";

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

  storage = getStorage();
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
  ): Promise<string> {
    let uploadFileName = filename || generateUUID();
    let uploadRef = ref(this.storage, `${location}/${uploadFileName}`);

    return uploadBytes(uploadRef, blob).then((snapshot) => {
      return getDownloadURL(snapshot.ref);
    });
  }

  deleteFromStorage(location: StorageFolder, filename: string): Promise<void> {
    return deleteObject(ref(this.storage, `${location}/${filename}`));
  }

  upload(): Observable<string> {
    return this.uploadObs;
  }

  makeThumbnailURL(pathUrl: string, size: number): string {
    return pathUrl.replace(/\?/, `_${size}x${size}?`);
  }
}
