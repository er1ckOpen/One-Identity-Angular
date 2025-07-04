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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule, Routes } from '@angular/router';
import { EuiCoreModule, EuiMaterialModule } from '@elemental-ui/core';
import { TranslateModule } from '@ngx-translate/core';

import {
  BulkPropertyEditorModule,
  BusyIndicatorModule,
  CdrModule,
  ClassloggerService,
  DataSourceToolbarModule,
  DataTableModule,
  DataViewModule,
  DateModule,
  EntityModule,
  HelpContextualModule,
  LdsReplaceModule,
  MenuItem,
  MenuService,
  RouteGuardService,
  SelectedElementsModule,
} from 'qbm';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { ItshopModule } from '../itshop/itshop.module';
import { JustificationModule } from '../justification/justification.module';
import { RequestHistoryModule } from '../request-history/request-history.module';
import { RequestsFeatureGuardService } from '../requests-feature-guard.service';
import { ApprovalsSidesheetComponent } from './approvals-sidesheet/approvals-sidesheet.component';
import { ApprovalsTableComponent } from './approvals-table.component';
import { ApprovalsComponent } from './approvals.component';
import { ApprovalsService } from './approvals.service';
import { InquiriesComponent } from './inquiries/inquiries.component';
import { RecommendationSidesheetComponent } from './recommendation-sidesheet/recommendation-sidesheet.component';
import { ApprovalHistoryComponent } from './workflow-action/approval-history/approval-history.component';
import { HistoryFilterComponent } from './workflow-action/approval-history/history-filter/history-filter.component';
import { WorkflowActionComponent } from './workflow-action/workflow-action.component';
import { WorkflowMultiActionComponent } from './workflow-action/workflow-multi-action/workflow-multi-action.component';
import { WorkflowSingleActionComponent } from './workflow-action/workflow-single-action/workflow-single-action.component';
import { QueryPersonComponent } from './workflow-actions/query-person.component';

const routes: Routes = [
  {
    path: 'itshop/approvals',
    component: ApprovalsComponent,
    canActivate: [RequestsFeatureGuardService],
    resolve: [RouteGuardService],
  },
];

@NgModule({
  declarations: [
    ApprovalsComponent,
    ApprovalsTableComponent,
    ApprovalsSidesheetComponent,
    QueryPersonComponent,
    WorkflowActionComponent,
    WorkflowMultiActionComponent,
    WorkflowSingleActionComponent,
    RecommendationSidesheetComponent,
    InquiriesComponent,
    ApprovalHistoryComponent,
    HistoryFilterComponent,
  ],
  imports: [
    BulkPropertyEditorModule,
    BusyIndicatorModule,
    MatCheckboxModule,
    MatTabsModule,
    CdrModule,
    CommonModule,
    DataSourceToolbarModule,
    DataTableModule,
    DateModule,
    EntityModule,
    EuiCoreModule,
    EuiMaterialModule,
    FormsModule,
    ItshopModule,
    JustificationModule,
    LdsReplaceModule,
    ReactiveFormsModule,
    RequestHistoryModule,
    RouterModule.forChild(routes),
    TranslateModule,
    SelectedElementsModule,
    HelpContextualModule,
    DataViewModule,
  ],
  providers: [ApprovalsService],
  exports: [RecommendationSidesheetComponent, WorkflowActionComponent],
})
export class ApprovalsModule {
  constructor(
    private readonly menuService: MenuService,
    logger: ClassloggerService,
  ) {
    logger.info(this, '▶️ ApprovalsModule loaded');
    this.setupMenu();
  }

  private setupMenu(): void {
    this.menuService.addMenuFactories((preProps: string[], features: string[]) => {
      const items: MenuItem[] = [];

      if (preProps.includes('ITSHOP')) {
        items.push({
          id: 'QER_Request_PendingRequests',
          navigationCommands: {
            commands: ['itshop', 'approvals'],
          },
          title: '#LDS#Menu Entry Pending requests',
          sorting: '10-30',
        });
      }

      if (items.length === 0) {
        return;
      }
      return {
        id: 'ROOT_Request',
        title: '#LDS#Requests',
        sorting: '10',
        items,
      };
    });
  }
}
