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

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { AppConfigService, RouteGuardService } from 'qbm';
import { CplPermissionsService } from '../rules/admin/cpl-permissions.service';

@Injectable({
  providedIn: 'root',
})
export class ComplianceRulesGuardService {
  constructor(
    private readonly permissionService: CplPermissionsService,
    private readonly appConfig: AppConfigService,
    private readonly router: Router,
    private readonly routeGuardService: RouteGuardService,
  ) {}

  public async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (await this.routeGuardService.canActivate(route, state)) {
      const userRuleStatistics = await this.permissionService.isRuleStatistics();
      if (!userRuleStatistics) {
        this.router.navigate([this.appConfig.Config.routeConfig?.start]);
      }
      return userRuleStatistics;
    }
    this.router.navigate([this.appConfig.Config.routeConfig?.login]);
    return false;
  }
}
