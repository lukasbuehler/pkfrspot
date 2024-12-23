import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpotReviewDialogComponent } from "./spot-review-dialog.component";

describe("SpotRatingDialogComponent", () => {
  let component: SpotReviewDialogComponent;
  let fixture: ComponentFixture<SpotReviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotReviewDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpotReviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
