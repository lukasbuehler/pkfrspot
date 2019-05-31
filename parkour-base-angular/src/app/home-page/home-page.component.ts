import { Component, OnInit, ViewChild } from '@angular/core';
import { DatabaseService } from 'src/app/database.service';
import { PostSchema } from 'src/scripts/db/Post';
import { PostCollectionComponent } from '../post-collection/post-collection.component';
import { MatDrawer } from '@angular/material';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit
{

  constructor(private _dbService: DatabaseService) { }

  updatePosts: any[] = [];
  trendingPosts: any[] = [];

  @ViewChild("updateCollection") updateCollection: PostCollectionComponent;

  @ViewChild("followingDrawer") followingDrawer: MatDrawer;
  @ViewChild("suggestionsDrawer") suggestionsDrawer: MatDrawer; 

  ngOnInit()
  {
    
    this._dbService.getPostUpdates().subscribe(
      data =>
      {
        this.updatePosts = this.updatePosts.concat(data);
      },
      error =>
      {
        console.error(error);
      },
      () => { } // complete 
    );
  }

  
  

  getMorePosts()
  {
    // get More posts
  }

  scrolledDown()
  {
    this.getMorePosts();
  }

  createPost()
  {
    this.updatePosts.push(this.updatePosts[0]);
  }
}
