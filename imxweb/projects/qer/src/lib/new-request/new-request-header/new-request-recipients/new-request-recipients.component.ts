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

import { Component, OnDestroy } from '@angular/core';
import { EuiSidesheetService } from '@elemental-ui/core';
import { MultiValue } from '@imx-modules/imx-qbm-dbts';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, FkAdvancedPickerComponent, MultiValueService, calculateSidesheetWidth } from 'qbm';
import { NewRequestOrchestrationService } from '../../new-request-orchestration.service';
import { FKAdvancedPickerResponse } from '../../new-request-product/fk-advanced-picker-response';
import { RecipientsApiService } from './recipients-api.service';

@Component({
  selector: 'imx-new-request-recipients',
  templateUrl: './new-request-recipients.component.html',
  styleUrls: ['./new-request-recipients.component.scss'],
})
export class NewRequestRecipientsComponent implements OnDestroy {
  constructor(
    public readonly orchestration: NewRequestOrchestrationService,
    private readonly multiValueProvider: MultiValueService,
    private recipientsApi: RecipientsApiService,
    private sidesheetService: EuiSidesheetService,
    private translateService: TranslateService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnDestroy(): void {
    // Make sure that once you navigate away the default user is set again within the service
    this.setDefaultUser();
  }

  public get nRecipients(): number {
    return MultiValue.FromString(this.orchestration.recipients.Column.GetValue()).GetValues().length;
  }

  public async openSidesheet(): Promise<void> {
    const idList = MultiValue.FromString(this.orchestration.recipients.Column.GetValue()).GetValues();
    const response: FKAdvancedPickerResponse = await this.sidesheetService
      .open(FkAdvancedPickerComponent, {
        title: await this.translateService.get('#LDS#Heading Select Recipients').toPromise(),
        icon: 'user',
        width: calculateSidesheetWidth(),
        padding: '0px',
        disableClose: true,
        testId: 'new-requests-recipients-sidesheet',
        data: {
          displayValue: '',
          isRequired: true,
          fkRelations: this.recipientsApi.getFKRelations(),
          isMultiValue: true,
          idList,
        },
      })
      .afterClosed()
      .toPromise();

    if (response && !!response?.candidates.length) {
      const recipients = {
        DataValue: this.multiValueProvider.getMultiValue(response.candidates.map((v) => v.DataValue)) || '',
        DisplayValue: this.multiValueProvider.getMultiValue(response.candidates.map((v) => v.DisplayValue)) || '',
      };
      await this.orchestration.setRecipients(recipients);
    }
  }

  private async setDefaultUser() {
    await this.orchestration.setDefaultUser();
  }

  public async clearRecipients(): Promise<void> {
    if (
      await this.confirmationService.confirm({
        Title: '#LDS#Heading Clear Recipients',
        Message: '#LDS#Are you sure you want to clear the recipients?',
      })
    ) {
      this.setDefaultUser();
    }
  }
}
