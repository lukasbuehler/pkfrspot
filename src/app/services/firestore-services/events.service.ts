import { Injectable } from "@angular/core";
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "@angular/fire/firestore";
import { SpotSlug } from "../../../scripts/db/Interfaces";
import { SpotId } from "../../../scripts/db/Spot";

@Injectable({
  providedIn: "root",
})
export class SlugsService {
  constructor(private firestore: Firestore) {}

  addEvent() {

  }

  getEventById() {
  }

  getEvents(sortByNext: boolean = true, location?: any, pageSize: number = 10) {

  }
}
