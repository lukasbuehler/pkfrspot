import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoverSpotsViewComponent } from './discover-spots-view.component';

describe('DiscoverSpotsViewComponent', () => {
  let component: DiscoverSpotsViewComponent;
  let fixture: ComponentFixture<DiscoverSpotsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiscoverSpotsViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscoverSpotsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
