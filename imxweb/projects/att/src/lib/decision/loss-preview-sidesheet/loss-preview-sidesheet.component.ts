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

import { Component, Inject } from '@angular/core';
import { EUI_SIDESHEET_DATA, EuiSidesheetRef } from '@elemental-ui/core';
import { LossPreview } from '../loss-preview.interface';

@Component({
  selector: 'imx-loss-preview-sidesheet',
  standalone: false,
  templateUrl: './loss-preview-sidesheet.component.html',
  styleUrl: './loss-preview-sidesheet.component.scss',
})
export class LossPreviewSidesheetComponent {
  constructor(
    @Inject(EUI_SIDESHEET_DATA)
    public data: {
      lossPreview: LossPreview;
      decisionFunc: () => Promise<void>;
    },
    private sidesheetRef: EuiSidesheetRef,
  ) {}

  /**
   * Cancel denial process, close sidesheet
   */
  public onCancel(): void {
    this.sidesheetRef.close();
  }

  /**
   * Continue denial process useing the passed denial function, close sidesheet after
   */
  public async onDeny(): Promise<void> {
    await this.data.decisionFunc();
    // We don't have a good way to know if the decision was cancelled at this point, close sidesheet always
    this.sidesheetRef.close();
  }
}
