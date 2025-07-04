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

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EntityData } from '@imx-modules/imx-qbm-dbts';
import { DecisionHistoryService } from '../decision-history.service';

import { TranslateService } from '@ngx-translate/core';
import { ApproverContainer } from './approver-container';
import { WorkflowHistoryItemWrapper } from './workflow-history-item-wrapper';

@Component({
  selector: 'imx-decision-history',
  templateUrl: './decision-history.component.html',
  styleUrls: ['./decision-history.component.scss'],
})
export class DecisionHistoryComponent implements OnChanges {
  @Input() public approverContainer: ApproverContainer;
  @Input() public workflow: WorkflowHistoryItemWrapper[];

  public approverAdditionalInfo: { [key: string]: { [key: string]: { string } } } = {};

  public approverNow: { display: string; data: EntityData[] }[] = [];
  public approverFuture: { display: string; data: EntityData[] }[] = [];
  constructor(
    public readonly decisionHistory: DecisionHistoryService,
    public translate: TranslateService,
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.approverContainer) {
      this.approverFuture = this.approverContainer?.getApproverSortedByStep();
      this.approverNow = this.approverContainer?.getApproverSortedByStep(false);
      this.approverAdditionalInfo = this.approverContainer?.getApproverAdditionalInfo(
        this.approverNow,
        this.translate.instant('#LDS#Compliance rule'),
      );
    }
  }
}
