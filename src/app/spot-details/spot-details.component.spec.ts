import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SpotDetailsComponent } from "./spot-details.component";

describe("SpotDetailComponent", () => {
  let component: SpotDetailsComponent;
  let fixture: ComponentFixture<SpotDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SpotDetailsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
