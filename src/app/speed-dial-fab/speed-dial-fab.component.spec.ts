import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SpeedDialFabComponent } from "./speed-dial-fab.component";

describe("SpeedDialFabComponent", () => {
  let component: SpeedDialFabComponent;
  let fixture: ComponentFixture<SpeedDialFabComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SpeedDialFabComponent],
}).compileComponents(); // compiles template and css
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpeedDialFabComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // Function tests
  it("#toggle() should toggle #isOpen", () => {
    expect(component.isOpen).toBe(false, "closed per default at first");
    component.toggle();
    expect(component.isOpen).toBe(true, "open after toggle from closed");
    component.toggle();
    expect(component.isOpen).toBe(false, "closed after toggle from open");
  });

  it("#open() should set #isOpen to true", () => {
    component.isOpen = false;
    component.open();
    expect(component.isOpen).toBe(true, "open after opening from closed");

    component.isOpen = true;
    component.open();
    expect(component.isOpen).toBe(true, "open after opening from open");
  });

  it("#close() should set #isOpen to false", () => {
    component.isOpen = true;
    component.close();
    expect(component.isOpen).toBe(false, "closed after closing from open");

    component.isOpen = false;
    component.close();
    expect(component.isOpen).toBe(false, "closed after closing from closed");
  });

  it("should open on mouseenter and close on mouseleave", () => {
    component.onMouseEnter();
    expect(component.isOpen).toBe(true, "open after mouse enter");
    component.onMouseLeave();
    expect(component.isOpen).toBe(false, "closed after mouse leave");
  });
});
