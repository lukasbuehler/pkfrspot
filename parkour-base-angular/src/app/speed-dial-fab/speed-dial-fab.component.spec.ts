import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeedDialFabComponent } from './speed-dial-fab.component';

describe('SpeedDialFabComponent', () => {
  let component: SpeedDialFabComponent;
  let fixture: ComponentFixture<SpeedDialFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpeedDialFabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpeedDialFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
