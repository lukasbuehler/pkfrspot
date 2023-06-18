import { TestBed } from '@angular/core/testing';

import { MapsApiService } from './maps-api.service';

describe('MapsApiService', () => {
  let service: MapsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
