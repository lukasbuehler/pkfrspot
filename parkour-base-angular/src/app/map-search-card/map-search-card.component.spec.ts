import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapSearchCardComponent } from './map-search-card.component';

describe('MapSearchCardComponent', () => {
  let component: MapSearchCardComponent;
  let fixture: ComponentFixture<MapSearchCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapSearchCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapSearchCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
