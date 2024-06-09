import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mat3FabComponent } from './mat3-fab.component';

describe('Mat3FabComponent', () => {
  let component: Mat3FabComponent;
  let fixture: ComponentFixture<Mat3FabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mat3FabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Mat3FabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
