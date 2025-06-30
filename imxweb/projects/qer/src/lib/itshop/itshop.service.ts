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
  PortalItshopApproveHistory,
  PortalItshopCart,
  PortalItshopPeergroupMemberships,
  PortalItshopPersondecision,
  PortalShopServiceitems,
  ServiceItemsExtendedData,
} from '@imx-modules/imx-api-qer';
import {
  ApiRequestOptions,
  CollectionLoadParameters,
  CompareOperator,
  EntityCollectionData,
  EntityData,
  EntitySchema,
  ExtendedTypedEntityCollection,
  FilterTreeData,
  FilterType,
  TypedEntityBuilder,
  TypedEntityCollectionData,
} from '@imx-modules/imx-qbm-dbts';
import { ClassloggerService } from 'qbm';
import { ServiceItemParameters } from '../new-request/new-request-product/service-item-parameters';
import { ParameterDataLoadParameters } from '../parameter-data/parameter-data-load-parameters.interface';
import { QerApiService } from '../qer-api-client.service';

@Injectable({
  providedIn: 'root',
})
export class ItshopService {
  public get PortalItshopPeergroupMembershipsSchema(): EntitySchema {
    return this.qerClient.typedClient.PortalItshopPeergroupMemberships.GetSchema();
  }

  public isChiefApproval = false;

  private readonly historyBuilder = new TypedEntityBuilder(PortalItshopApproveHistory);

  constructor(
    private readonly qerClient: QerApiService,
    private readonly logger: ClassloggerService,
  ) {}

  public async get(
    parameters: CollectionLoadParameters & {
      UID_Person?: string;
      UID_AccProductGroup?: string;
      IncludeChildCategories?: boolean;
      UID_AccProductParent?: string;
      UID_PersonReference?: string;
      UID_PersonPeerGroup?: string;
    },
  ): Promise<ExtendedTypedEntityCollection<PortalShopServiceitems, ServiceItemsExtendedData>> {
    return this.qerClient.typedClient.PortalShopServiceitems.Get(parameters);
  }

  public async getServiceItem(serviceItemUid: string, isSkippable?: boolean): Promise<PortalShopServiceitems | undefined> {
    const serviceItemCollection = await this.get({
      IncludeChildCategories: false,
      filter: [
        {
          ColumnName: 'UID_AccProduct',
          Type: FilterType.Compare,
          CompareOp: CompareOperator.Equal,
          Value1: serviceItemUid,
        },
      ],
    });
    if (serviceItemCollection == null || serviceItemCollection.Data == null || serviceItemCollection.Data.length === 0) {
      if (isSkippable) {
        return undefined;
      }
      throw new Error('getServiceItem - service item not found');
    }

    return serviceItemCollection.Data[0];
  }

  public async getPeerGroupMemberships(
    parameters: CollectionLoadParameters | ServiceItemParameters,
    requestOpts?: ApiRequestOptions,
  ): Promise<ExtendedTypedEntityCollection<PortalItshopPeergroupMemberships, ServiceItemsExtendedData>> {
    return this.qerClient.typedClient.PortalItshopPeergroupMemberships.Get(parameters, requestOpts);
  }

  public createTypedHistory(pwoData: EntityData[], startIndex: number = 0): PortalItshopApproveHistory[] {
    if (pwoData.length) {
      const endIndex: number = Math.min(pwoData.length, startIndex + 100); //calculate end index
      const length: number = pwoData.length < 100 ? pwoData.length : Math.min(100, pwoData.length - startIndex); // calculate length of extracted  data
      const history = { TotalCount: length, Entities: pwoData.length < 100 ? pwoData : pwoData.slice(startIndex, endIndex) }; //get new history data
      return this.historyBuilder.buildReadWriteEntities(history, this.qerClient.typedClient.PortalItshopApproveHistory.GetSchema()).Data;
    }

    return [];
  }

  public async getRequestParameterCandidates(parameters: ParameterDataLoadParameters): Promise<EntityCollectionData> {
    return this.qerClient.client.portal_itshop_requests_parameter_candidates_post(
      parameters.columnName,
      parameters.fkTableName || '',
      parameters.diffData || {},
      {
        OrderBy: parameters.OrderBy,
        StartIndex: parameters.StartIndex,
        PageSize: parameters.PageSize,
        filter: parameters.filter,
        search: parameters.search,
        ParentKey: parameters.ParentKey,
      },
    );
  }

  public async getRequestParameterFilterTree(parameters: ParameterDataLoadParameters): Promise<FilterTreeData> {
    return this.qerClient.client.portal_itshop_requests_parameter_candidates_filtertree_post(
      parameters.columnName,
      parameters.fkTableName || '',
      parameters.diffData || {},
      {
        filter: parameters.filter,
        parentkey: parameters.ParentKey,
      },
    );
  }

  public async getApprovers(uidRequest: string): Promise<TypedEntityCollectionData<PortalItshopPersondecision>> {
    return this.qerClient.typedClient.PortalItshopPersondecision.Get(uidRequest);
  }

  public async getCarts(): Promise<TypedEntityCollectionData<PortalItshopCart>> {
    return this.qerClient.typedClient.PortalItshopCart.Get({ PageSize: 1048576 });
  }

  public async deleteShoppingCart(uidShoppingCart: string): Promise<EntityCollectionData> {
    this.logger.log(this, 'Deleting shopping cart...');
    return this.qerClient.client.portal_itshop_cart_delete(uidShoppingCart);
  }
}
