import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KmlImportPageComponent } from './kml-import-page.component';

describe('KmlImportPageComponent', () => {
  let component: KmlImportPageComponent;
  let fixture: ComponentFixture<KmlImportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KmlImportPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KmlImportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
