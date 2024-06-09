import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMenuContentComponent } from './user-menu-content.component';

describe('UserMenuContentComponent', () => {
  let component: UserMenuContentComponent;
  let fixture: ComponentFixture<UserMenuContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [UserMenuContentComponent]
});
    fixture = TestBed.createComponent(UserMenuContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
