import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotDetailComponent } from './spot-detail.component';

describe('SpotDetailComponent', () => {
  let component: SpotDetailComponent;
  let fixture: ComponentFixture<SpotDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpotDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
