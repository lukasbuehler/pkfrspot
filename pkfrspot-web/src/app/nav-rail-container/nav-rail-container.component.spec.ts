import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavRailContainerComponent } from './nav-rail-container.component';

describe('NavRailContainerComponent', () => {
  let component: NavRailContainerComponent;
  let fixture: ComponentFixture<NavRailContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavRailContainerComponent]
    });
    fixture = TestBed.createComponent(NavRailContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
