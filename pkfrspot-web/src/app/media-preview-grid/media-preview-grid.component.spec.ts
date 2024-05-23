import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaPreviewGridComponent } from './media-preview-grid.component';

describe('MediaPreviewGridComponent', () => {
  let component: MediaPreviewGridComponent;
  let fixture: ComponentFixture<MediaPreviewGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MediaPreviewGridComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaPreviewGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
