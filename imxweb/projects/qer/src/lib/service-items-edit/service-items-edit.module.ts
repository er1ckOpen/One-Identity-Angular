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
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { EuiCoreModule, EuiMaterialModule } from '@elemental-ui/core';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import {
  CdrModule,
  ClassloggerService,
  DataSourceToolbarModule,
  DataTableModule,
  DataViewModule,
  HELP_CONTEXTUAL,
  HelpContextualModule,
  MenuItem,
  MenuService,
} from 'qbm';
import { isShopAdmin } from '../admin/qer-permissions-helper';
import { ShopAdminGuardService } from '../guards/shop-admin-guard.service';
import { ObjectHyperviewModule } from '../object-hyperview/object-hyperview.module';
import { ServiceItemsEditFormModule } from './service-items-edit-form/service-items-edit-form.module';
import { ServiceItemsEditSidesheetComponent } from './service-items-edit-sidesheet/service-items-edit-sidesheet.component';
import { ServiceItemsEditComponent } from './service-items-edit.component';

const routes: Routes = [
  {
    path: 'admin/serviceitems',
    component: ServiceItemsEditComponent,
    canActivate: [ShopAdminGuardService],
    data: {
      contextId: HELP_CONTEXTUAL.ServiceItems,
    },
  },
];

@NgModule({
  declarations: [ServiceItemsEditComponent, ServiceItemsEditSidesheetComponent],
  imports: [
    CommonModule,
    CdrModule,
    DataSourceToolbarModule,
    DataTableModule,
    EuiCoreModule,
    EuiMaterialModule,
    ObjectHyperviewModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    ServiceItemsEditFormModule,
    TranslateModule,
    HelpContextualModule,
    MatTableModule,
    DataViewModule,
  ],
})
export class ServiceItemsEditModule {
  constructor(
    private readonly menuService: MenuService,
    logger: ClassloggerService,
  ) {
    logger.info(this, '▶️ ServiceItemsEditModule loaded');
    this.setupMenu();
  }

  private setupMenu(): void {
    this.menuService.addMenuFactories((preProps: string[], features: string[]) => {
      const items: MenuItem[] = [];

      if (isShopAdmin(features)) {
        items.push({
          id: 'QER_ServiceItems',
          navigationCommands: { commands: ['admin', 'serviceitems'] },
          title: '#LDS#Menu Entry Service items',
          sorting: '60-40',
        });
      }

      if (items.length === 0) {
        return;
      }
      return {
        id: 'ROOT_Setup',
        title: '#LDS#Setup',
        sorting: '60',
        items,
      };
    });
  }
}
