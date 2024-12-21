import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotRatingDialogComponent } from './spot-rating-dialog.component';

describe('SpotRatingDialogComponent', () => {
  let component: SpotRatingDialogComponent;
  let fixture: ComponentFixture<SpotRatingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotRatingDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpotRatingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
