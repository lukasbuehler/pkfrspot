import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PostCollectionComponent } from './post-collection.component';

describe('PostCollectionComponent', () => {
  let component: PostCollectionComponent;
  let fixture: ComponentFixture<PostCollectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PostCollectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
