import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavRailContentComponent } from './nav-rail-content.component';

describe('NavRailContentComponent', () => {
  let component: NavRailContentComponent;
  let fixture: ComponentFixture<NavRailContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavRailContentComponent]
    });
    fixture = TestBed.createComponent(NavRailContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
