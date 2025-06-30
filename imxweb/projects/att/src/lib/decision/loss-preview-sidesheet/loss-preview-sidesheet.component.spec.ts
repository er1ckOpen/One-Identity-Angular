/*
 * ONE IDENTITY LLC. PROPRIETARY INFORMATION
 *
 * This software is confidential.  One Identity, LLC. or one of its affiliates or
 * subsidiaries, has supplied this software to you under terms of a
 * license agreement, nondisclosure agreement or both.
 *
 * You may not copy, disclose, or use this software except in accordance with
 * those terms.
 *
 *
 * Copyright 2024 One Identity LLC.
 * ALL RIGHTS RESERVED.
 *
 * ONE IDENTITY LLC. MAKES NO REPRESENTATIONS OR
 * WARRANTIES ABOUT THE SUITABILITY OF THE SOFTWARE,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, OR
 * NON-INFRINGEMENT.  ONE IDENTITY LLC. SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE
 * AS A RESULT OF USING, MODIFYING OR DISTRIBUTING
 * THIS SOFTWARE OR ITS DERIVATIVES.
 *
 */

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { EUI_SIDESHEET_DATA, EuiSidesheetRef } from '@elemental-ui/core';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { clearStylesFromDOM } from 'qbm';
import { LossPreviewSidesheetComponent } from './loss-preview-sidesheet.component';

describe('ChartsSidesheetComponent', () => {
  let component: LossPreviewSidesheetComponent;
  let fixture: MockedComponentFixture<LossPreviewSidesheetComponent>;

  beforeEach(() => {
    return MockBuilder([LossPreviewSidesheetComponent])
      .mock(EuiSidesheetRef, {
        close: () => {},
      })
      .mock(EUI_SIDESHEET_DATA, {
        lossPreview: {},
        decisionFunc: () => {},
      })
      .beforeCompileComponents((testBed) => {
        testBed.configureTestingModule({
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
        });
      });
  });

  beforeEach(() => {
    fixture = MockRender(LossPreviewSidesheetComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  afterAll(() => {
    clearStylesFromDOM();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
