import { Injectable } from '@angular/core';
import { keys } from "src/environments/keys";

import { Post, PostSchema } from "src/scripts/db/Post";
import { Spot } from "src/scripts/db/Spot";

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private db: AngularFirestore) { }

  addPost(newPost: PostSchema)
  {
    this.db.collection("posts").add(newPost).then(
      docRef =>
      {
        console.log("Post Document written with ID: "+docRef.id);
      }
    ).catch(
      error =>
      {
        console.error("Error adding Post Document: ", error);
      }
    );
  }

  getPostUpdates(): Observable<any[]>
  {
    return new Observable<any[]>(observer => {
      this.db.collection("posts").get().subscribe((querySnapshot) =>
      {
        let posts = [];

        querySnapshot.forEach((doc) => {
          posts.push(doc.data());
        });

        observer.next(posts);
        observer.complete();
      },
      error => {
        observer.error(error);
      },
      () => {})
    });
  }

  getTrendingPosts()
  {

  }

  getTestSpots(): Observable<Spot.Class[]>
  {
    return new Observable<Spot.Class[]>(observer =>
    {
      this.db.collection("spots").get().subscribe((querySnapshot) =>
      {
        let spots: Spot.Class[] = [];

        console.log("Hello")
        querySnapshot.forEach((doc) =>
        {
          if (doc.data() as Spot.Schema)
          {
            let newSpot: Spot.Class = new Spot.Class(doc.id, doc.data() as Spot.Schema);
            console.log(newSpot);

            spots.push(newSpot);
          }
          else
          {
            console.error("Spot could not be cast to Spot.Schema!");
            observer.complete();
          }
        });

        observer.next(spots);
        observer.complete();
      },
        error =>
        {
          observer.error(error);
          observer.complete();
        },
        () => { })
    });
  }

  getSpotSearch(searchString: string): Observable<Spot.Class[]>
  {
    return new Observable<any[]>(observer => {
      this.db.collection("spots").get()
    })
  }

  getSpotsOnMap()
  {

  }

  setSpot(spot: Spot.Class): Observable<any>
  {
    let spotId: string = spot.id;

    return new Observable<any>(observer => {
      this.db.collection("spots").doc(spot.id).set(spot.data).then(
        /* fulfilled */ value => {
          observer.next(value);
          observer.complete();
        },
        /* rejected */ reason => {
          observer.error(reason);
        }
        ).catch(error => {
          observer.error(error);
        })
    })
  }
  
}
