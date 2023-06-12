import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mat3NavButtonComponent } from './mat3-nav-button.component';

describe('Mat3NavButtonComponent', () => {
  let component: Mat3NavButtonComponent;
  let fixture: ComponentFixture<Mat3NavButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Mat3NavButtonComponent]
    });
    fixture = TestBed.createComponent(Mat3NavButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
