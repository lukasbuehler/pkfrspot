import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SpotRatingComponent } from "./spot-rating.component";

describe("RatingComponent", () => {
  let component: SpotRatingComponent;
  let fixture: ComponentFixture<SpotRatingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SpotRatingComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
