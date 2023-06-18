import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotPageComponent } from './spot-page.component';

describe('SpotPageComponent', () => {
  let component: SpotPageComponent;
  let fixture: ComponentFixture<SpotPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SpotPageComponent]
    });
    fixture = TestBed.createComponent(SpotPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
