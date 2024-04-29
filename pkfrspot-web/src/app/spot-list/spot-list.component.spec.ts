import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotListComponent } from './spot-list.component';

describe('SpotListComponent', () => {
  let component: SpotListComponent;
  let fixture: ComponentFixture<SpotListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SpotListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
