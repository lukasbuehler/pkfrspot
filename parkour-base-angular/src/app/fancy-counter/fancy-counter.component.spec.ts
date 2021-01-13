import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FancyCounterComponent } from './fancy-counter.component';

describe('FancyCounterComponent', () => {
  let component: FancyCounterComponent;
  let fixture: ComponentFixture<FancyCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FancyCounterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FancyCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
