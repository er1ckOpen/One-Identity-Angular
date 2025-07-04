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
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { EuiCoreModule } from '@elemental-ui/core';

import { ClassloggerService, HELP_CONTEXTUAL, RouteGuardService } from 'qbm';
import { TilesModule } from 'qer';
import { DashboardPluginComponent } from './dashboard-plugin/dashboard-plugin.component';
import { PolicyAdminGuardService } from './guards/policy-admin-guard.service';
import { PolicyAdminOrOwnerGuardService } from './guards/policy-owner-or-admin-guard.service';
import { InitService } from './init.service';
import { PoliciesComponent } from './policies/policies.component';
import { PoliciesModule } from './policies/policies.module';
import { PolicyViolationsComponent } from './policy-violations/policy-violations.component';
import { PolicyViolationsModule } from './policy-violations/policy-violations.module';

const routes: Routes = [
  {
    path: 'compliance/policyviolations/approve',
    component: PolicyViolationsComponent,
    canActivate: [PolicyAdminGuardService],
    resolve: [RouteGuardService],
    data: {
      contextId: HELP_CONTEXTUAL.CompliancePolicyViolations,
    },
  },
  {
    path: 'compliance/policyviolations',
    component: PolicyViolationsComponent,
    canActivate: [PolicyAdminGuardService],
    resolve: [RouteGuardService],
    data: {
      contextId: HELP_CONTEXTUAL.CompliancePolicyViolations,
    },
  },
  {
    path: 'compliance/policies',
    component: PoliciesComponent,
    canActivate: [PolicyAdminOrOwnerGuardService],
    resolve: [RouteGuardService],
    data: {
      contextId: HELP_CONTEXTUAL.CompanyPolicies,
    },
  },
];

@NgModule({
  declarations: [DashboardPluginComponent],
  imports: [
    CommonModule,
    TilesModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatListModule,
    TranslateModule,
    EuiCoreModule,
    PoliciesModule,
    PolicyViolationsModule,
  ],
})
export class PolConfigModule {
  constructor(
    private readonly initializer: InitService,
    private readonly logger: ClassloggerService,
  ) {
    this.logger.info(this, '🔥 POL loaded');
    this.initializer.onInit(routes);
    this.logger.info(this, '▶️ POL initialized');
  }
}
