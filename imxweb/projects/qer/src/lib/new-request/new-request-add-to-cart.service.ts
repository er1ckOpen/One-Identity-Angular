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

import {
  PortalItshopPatternRequestable,
  PortalItshopPeergroupMemberships,
  PortalShopServiceitems,
  QerProjectConfig,
  RequestableProductForPerson,
} from '@imx-modules/imx-api-qer';
import { MultiValue, ValueStruct } from '@imx-modules/imx-qbm-dbts';

import { EuiLoadingService, EuiSidesheetService } from '@elemental-ui/core';
import { TranslateService } from '@ngx-translate/core';
import { SnackBarService, calculateSidesheetWidth } from 'qbm';
import { ShelfService } from '../itshop/shelf.service';
import { PatternItemService } from '../pattern-item-list/pattern-item.service';
import { DependencyService } from '../product-selection/optional-items-sidesheet/dependency.service';
import { OptionalItemsSidesheetComponent } from '../product-selection/optional-items-sidesheet/optional-items-sidesheet.component';
import { RecipientsWrapper } from '../product-selection/recipients-wrapper';
import { ServiceItemOrder } from '../product-selection/service-item-order.interface';
import { ProjectConfigurationService } from '../project-configuration/project-configuration.service';
import { ServiceItemsService } from '../service-items/service-items.service';
import { CartItemsService } from '../shopping-cart/cart-items.service';
import { UserModelService } from '../user/user-model.service';
import { NewRequestOrchestrationService } from './new-request-orchestration.service';
import { SelectedProductSource } from './new-request-selected-products/selected-product-item.interface';
import { NewRequestSelectionService } from './new-request-selection.service';

// TODO: not used anymore - can be removed
@Injectable({
  providedIn: 'root',
})
export class NewRequestAddToCartService {
  private projectConfig: QerProjectConfig;
  private savedItems = 0;
  private possibleItems = 0;

  constructor(
    public readonly orchestration: NewRequestOrchestrationService,
    public readonly selectionService: NewRequestSelectionService,
    private readonly busyIndicator: EuiLoadingService,
    private readonly cartItemsProvider: CartItemsService,
    private readonly optionalItemsService: DependencyService,
    private readonly patternItemsService: PatternItemService,
    private readonly projectConfigService: ProjectConfigurationService,
    private readonly serviceItemsProvider: ServiceItemsService,
    private readonly shelfService: ShelfService,
    private readonly snackbar: SnackBarService,
    private readonly sidesheetService: EuiSidesheetService,
    private readonly userModelService: UserModelService,
    private readonly translate: TranslateService,
  ) {}

  public async addItemsToCart(): Promise<void> {
    if (this.orchestration.recipients == null) {
      return;
    }

    this.projectConfig = await this.projectConfigService.getConfig();
    const recipients = this.getRecipients();

    const serviceItemsForPersons = await this.createRequestableProductsFromServiceItems(recipients);
    // Cancel the add to cart process.
    if (!serviceItemsForPersons) {
      return;
    }
    const templateItemsForPersons = await this.createRequestableProductsFromBundleItems(recipients);

    // merge both lists to a combined list and create the PortalCartItems
    const requestableProductForPerson = serviceItemsForPersons.concat(...templateItemsForPersons);
    await this.addRequestablesToCart(requestableProductForPerson);

    await this.addOrgsToCart();

    // show snackbar
    if (this.savedItems !== this.possibleItems) {
      this.snackbar.open({
        key:
          this.savedItems === 0
            ? '#LDS#No product could be added to your shopping cart.'
            : '#LDS#{0} of {1} products could not be added to your shopping cart.',
        parameters: [this.possibleItems - this.savedItems, this.possibleItems],
      });
    } else {
      this.snackbar.open({
        key: '#LDS#{0} products have been successfully added to your shopping cart.',
        parameters: [this.savedItems],
      });
    }
    await this.userModelService.reloadPendingItems();

    this.selectionService.clearProducts();
  }

  private getRecipients(): ValueStruct<string>[] {
    const recipientsUids = MultiValue.FromString(this.orchestration.recipients.value).GetValues();
    const recipientsDisplays = MultiValue.FromString(this.orchestration.recipients.Column.GetDisplayValue()).GetValues();

    return recipientsUids.map((uid, index) => ({
      DataValue: uid,
      DisplayValue: recipientsDisplays[index],
    }));
  }

  private async addRequestablesToCart(requestableProductForPerson: RequestableProductForPerson[]): Promise<void> {
    if (requestableProductForPerson && requestableProductForPerson.length > 0) {
      const hasItems = await this.shelfService.setShops(requestableProductForPerson);
      if (!hasItems) {
        // We couldn't set the shop for some reason, force the success state to not pop by setting saved = 0, possible /= 0
        this.savedItems = 0;
        this.possibleItems = requestableProductForPerson.length;
        return;
      }
      if (this.busyIndicator.overlayRefs.length === 0) {
        this.busyIndicator.show();
      }
      try {
        this.copyShopInfoForDups(requestableProductForPerson);
        const items = requestableProductForPerson.filter((item) => !!item.UidITShopOrg?.length);
        const itemResult = await this.cartItemsProvider.addItems(items);
        this.possibleItems = itemResult.possibleItems;
        this.savedItems = itemResult.savedItems;
      } finally {
        this.busyIndicator.hide();
      }
    }
  }

  private async addOrgsToCart(): Promise<void> {
    const roles = this.selectionService.selectedProducts.filter(
      (x) => x.source === SelectedProductSource.PeerGroupOrgs || x.source === SelectedProductSource.ReferenceUserOrgs,
    );
    if (roles && roles.length > 0) {
      const recipientsWrapper = new RecipientsWrapper(this.orchestration.recipients);
      this.showBusyIndicator();
      try {
        const orgs = roles.map((x) => x.item) as PortalItshopPeergroupMemberships[];
        await this.cartItemsProvider.addItemsFromRoles(
          orgs.map((item) => item.XObjectKey.value),
          recipientsWrapper?.uids,
        );
        this.possibleItems = roles.length;
        this.savedItems = roles.length;
      } finally {
        this.busyIndicator.hide();
      }
    }
  }

  private async createRequestableProductsFromServiceItems(
    recipients: ValueStruct<string>[],
  ): Promise<RequestableProductForPerson[] | undefined> {
    const requests = this.selectionService.selectedProducts.filter(
      (x) =>
        x.source === SelectedProductSource.AllProducts ||
        x.source === SelectedProductSource.PeerGroupProducts ||
        x.source === SelectedProductSource.ReferenceUserProducts,
    );

    let serviceItemsForPersons: RequestableProductForPerson[] = [];
    let optionalItemsForPersons: RequestableProductForPerson[] | undefined = [];

    if (requests && requests.length > 0) {
      const serviceItems = requests.map((x) => x.item) as PortalShopServiceitems[];

      // first get all optional service items
      if (this.projectConfig?.ITShopConfig?.VI_ITShop_AddOptionalProductsOnInsert) {
        optionalItemsForPersons = await this.openOptionalSideSheet(serviceItems);
        // Cancel the add to cart process when cancel the optional sidesheet.
        if (!optionalItemsForPersons) {
          return undefined;
        }
      }

      this.showBusyIndicator();
      try {
        serviceItemsForPersons = this.serviceItemsProvider.getServiceItemsForPersons(serviceItems, recipients);
      } finally {
        this.busyIndicator.hide();
      }
    }
    return serviceItemsForPersons.concat(...optionalItemsForPersons);
  }

  private async createRequestableProductsFromBundleItems(recipients: ValueStruct<string>[]): Promise<RequestableProductForPerson[]> {
    const requests = this.selectionService.selectedProducts.filter((x) => x.source === SelectedProductSource.ProductBundles);
    let productBundleItems: PortalItshopPatternRequestable[] = [];
    let productBundleItemsForPersons: RequestableProductForPerson[] = [];
    if (requests && requests.length > 0) {
      this.showBusyIndicator();
      try {
        productBundleItems = requests.map((x) => x.item) as PortalItshopPatternRequestable[];
        productBundleItemsForPersons = await this.patternItemsService.getPatternItemsForPersons(
          productBundleItems,
          recipients,
          undefined,
          true,
        );
      } finally {
        this.busyIndicator.hide();
      }
    }
    return productBundleItemsForPersons;
  }

  private async openOptionalSideSheet(serviceItems: PortalShopServiceitems[]): Promise<RequestableProductForPerson[] | undefined> {
    const serviceItemTree = await this.optionalItemsService.checkForOptionalTree(serviceItems, this.orchestration.recipients);
    if (!!serviceItemTree?.totalOptional) {
      const selectedOptionalOrder: ServiceItemOrder = await this.sidesheetService
        .open(OptionalItemsSidesheetComponent, {
          title: await this.translate.get('#LDS#Heading Request Optional Products').toPromise(),
          padding: '0px',
          width: calculateSidesheetWidth(1000),
          testId: 'optional-items-sidesheet',
          disableClose: true,
          data: {
            serviceItemTree,
            projectConfig: this.projectConfig,
          },
        })
        .afterClosed()
        .toPromise();
      if (selectedOptionalOrder) {
        return selectedOptionalOrder.requestables || [];
      } else {
        return undefined;
      }
    }
    return [];
  }

  /**
   * This function is used to copy info for the service items that were duplicated under different parents.
   * @param serviceItemsForPersons
   * @returns
   */
  private copyShopInfoForDups(serviceItemsForPersons: RequestableProductForPerson[]): void {
    const itemsWithItShop = serviceItemsForPersons.filter((item) => item.UidITShopOrg && item.UidITShopOrg.length > 0);
    if (itemsWithItShop.length === serviceItemsForPersons.length) {
      // All items have itshops, we can skip
      return;
    }
    itemsWithItShop.forEach((itemWithItShop) => {
      // Loop over all items that have an ITShop, get any service items that match its uid and also have no itshop set yet, and set them
      serviceItemsForPersons
        .filter(
          (item) =>
            !item.UidITShopOrg && item.UidAccProduct === itemWithItShop.UidAccProduct && item.UidPerson === itemWithItShop.UidPerson,
        )
        .forEach((item) => (item.UidITShopOrg = itemWithItShop.UidITShopOrg));
    });
    return;
  }

  private showBusyIndicator(): void {
    if (this.busyIndicator.overlayRefs.length === 0) {
      this.busyIndicator.show();
    }
  }
}
