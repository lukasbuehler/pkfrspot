import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SpotCompactViewComponent } from "./spot-compact-view.component";

describe("SpotDetailComponent", () => {
  let component: SpotCompactViewComponent;
  let fixture: ComponentFixture<SpotCompactViewComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
    imports: [SpotCompactViewComponent],
}).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotCompactViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
