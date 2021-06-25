import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SpotPreviewCardComponent } from "./spot-preview-card.component";

describe("SpotCardComponent", () => {
  let component: SpotPreviewCardComponent;
  let fixture: ComponentFixture<SpotPreviewCardComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SpotPreviewCardComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotPreviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
