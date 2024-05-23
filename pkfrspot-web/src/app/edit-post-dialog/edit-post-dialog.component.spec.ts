import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditPostDialogComponent } from './edit-post-dialog.component';

describe('EditPostDialogComponent', () => {
  let component: EditPostDialogComponent;
  let fixture: ComponentFixture<EditPostDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [EditPostDialogComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPostDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
