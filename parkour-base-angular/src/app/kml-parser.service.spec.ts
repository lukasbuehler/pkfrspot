import { TestBed } from '@angular/core/testing';

import { KmlParserService } from './kml-parser.service';

describe('KmlParserService', () => {
  let service: KmlParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KmlParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
