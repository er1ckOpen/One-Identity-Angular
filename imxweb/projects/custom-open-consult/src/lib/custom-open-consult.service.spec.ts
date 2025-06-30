import { TestBed } from '@angular/core/testing';

import { CustomOpenConsultService } from './custom-open-consult.service';

describe('CustomOpenConsultService', () => {
  let service: CustomOpenConsultService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomOpenConsultService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
