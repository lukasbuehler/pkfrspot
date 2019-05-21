import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WikiPageComponent } from './wiki-page.component';

describe('WikiPageComponent', () => {
  let component: WikiPageComponent;
  let fixture: ComponentFixture<WikiPageComponent>;

  beforeEach(async(() => {
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
