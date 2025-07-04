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
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { RouterModule, Routes } from '@angular/router';
import { EuiCoreModule } from '@elemental-ui/core';
import { TranslateModule } from '@ngx-translate/core';

import { CdrModule, ClassloggerService, HELP_CONTEXTUAL, RouteGuardService } from 'qbm';
import { TilesModule } from 'qer';
import { DashboardPluginComponent } from './dashboard-plugin/dashboard-plugin.component';
import { InitService } from './init.service';
import { CartItemComplianceCheckComponent } from './item-validator/cart-item-compliance-check/cart-item-compliance-check.component';
import { RulesComponent } from './rules/rules.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { ComplianceRulesGuardService } from './guards/compliance-rules-guard.service';
import { RuleViolationsGuardService } from './guards/rule-violations-guard.service';
import { IdentityRuleViolationsModule } from './identity-rule-violations/identity-rule-violations.module';
import { RequestModule } from './request/request.module';
import { RulesViolationsComponent } from './rules-violations/rules-violations.component';
import { RulesViolationsModule } from './rules-violations/rules-violations.module';
const routes: Routes = [
  {
    path: 'compliance/rules',
    component: RulesComponent,
    canActivate: [ComplianceRulesGuardService],
    resolve: [RouteGuardService],
    data: {
      contextId: HELP_CONTEXTUAL.ComplianceRules,
    },
  },
  {
    path: 'compliance/rulesviolations/approve',
    component: RulesViolationsComponent,
    canActivate: [RuleViolationsGuardService],
    resolve: [RouteGuardService],
    data: {
      contextId: HELP_CONTEXTUAL.ComplianceRulesViolationsApprove,
    },
  },
];

@NgModule({
  declarations: [DashboardPluginComponent, CartItemComplianceCheckComponent],
  imports: [
    CommonModule,
    CdrModule,
    EuiCoreModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    RulesViolationsModule,
    RequestModule,
    TilesModule,
    TranslateModule,
    EuiCoreModule,
    IdentityRuleViolationsModule,
  ],
})
export class CplConfigModule {
  constructor(
    private readonly initializer: InitService,
    private readonly logger: ClassloggerService,
  ) {
    this.logger.info(this, '🔥 CPL loaded');
    this.initializer.onInit(routes);
    this.logger.info(this, '▶︝ CPL initialized');
  }
}
