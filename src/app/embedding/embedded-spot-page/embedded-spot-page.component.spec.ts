import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmbeddedSpotPageComponent } from './embedded-spot-page.component';

describe('EmbeddedSpotPageComponent', () => {
  let component: EmbeddedSpotPageComponent;
  let fixture: ComponentFixture<EmbeddedSpotPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmbeddedSpotPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmbeddedSpotPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
