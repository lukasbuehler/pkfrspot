import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotMetaInfoComponent } from './spot-meta-info.component';

describe('SpotMetaInfoComponent', () => {
  let component: SpotMetaInfoComponent;
  let fixture: ComponentFixture<SpotMetaInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotMetaInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpotMetaInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
