import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmbeddedMapPageComponent } from './embedded-map-page.component';

describe('EmbeddedMapPageComponent', () => {
  let component: EmbeddedMapPageComponent;
  let fixture: ComponentFixture<EmbeddedMapPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmbeddedMapPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmbeddedMapPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
