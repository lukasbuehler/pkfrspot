import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SpotCardComponent } from './spot-card.component';

describe('SpotCardComponent', () => {
  let component: SpotCardComponent;
  let fixture: ComponentFixture<SpotCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SpotCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
