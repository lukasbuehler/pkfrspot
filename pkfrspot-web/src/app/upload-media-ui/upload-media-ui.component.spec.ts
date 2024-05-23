import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UploadMediaUiComponent } from './upload-media-ui.component';

describe('UploadMediaUiComponent', () => {
  let component: UploadMediaUiComponent;
  let fixture: ComponentFixture<UploadMediaUiComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [UploadMediaUiComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadMediaUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
