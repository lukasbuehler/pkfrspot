import { Injectable } from '@angular/core';
import { keys } from "src/environments/keys";

import { Post, PostSchema } from "src/scripts/db/Post";

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

  getTestSpots()
  {
    return new Observable<any[]>(observer =>
    {
      this.db.collection("spots").get().subscribe((querySnapshot) =>
      {
        let spots = [];

        querySnapshot.forEach((doc) =>
        {
          spots.push(doc.data());
        });

        observer.next(spots);
        observer.complete();
      },
        error =>
        {
          observer.error(error);
        },
        () => { })
    });
  }

  
}
