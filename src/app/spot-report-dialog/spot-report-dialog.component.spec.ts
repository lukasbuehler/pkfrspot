import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpotReportDialogComponent } from "./spot-report-dialog.component";

describe("SpotReportComponent", () => {
  let component: SpotReportDialogComponent;
  let fixture: ComponentFixture<SpotReportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotReportDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpotReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
