import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WikiPageComponent } from './wiki-page.component';

describe('WikiPageComponent', () => {
  let component: WikiPageComponent;
  let fixture: ComponentFixture<WikiPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WikiPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WikiPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
