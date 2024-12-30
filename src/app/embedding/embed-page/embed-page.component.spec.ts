import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmbedPageComponent } from './embed-page.component';

describe('EmbedPageComponent', () => {
  let component: EmbedPageComponent;
  let fixture: ComponentFixture<EmbedPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmbedPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmbedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
