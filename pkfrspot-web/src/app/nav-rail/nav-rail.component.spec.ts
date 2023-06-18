import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavRailComponent } from './nav-rail.component';

describe('NavRailComponent', () => {
  let component: NavRailComponent;
  let fixture: ComponentFixture<NavRailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavRailComponent]
    });
    fixture = TestBed.createComponent(NavRailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
