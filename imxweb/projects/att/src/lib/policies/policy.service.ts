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
import { EuiDownloadOptions } from '@elemental-ui/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ParmData,
  PolicyFilter,
  PolicyStartInput,
  PortalAttestationFilterMatchingobjects,
  PortalAttestationPolicyEdit,
  PortalAttestationPolicyEditInteractive,
  V2ApiClientMethodFactory,
} from '@imx-modules/imx-api-att';
import {
  CollectionLoadParameters,
  CompareOperator,
  DataModel,
  EntityCollectionData,
  EntitySchema,
  ExtendedEntityCollectionData,
  ExtendedTypedEntityCollection,
  FilterType,
  GroupInfoData,
  MethodDefinition,
  MethodDescriptor,
  TypedEntityBuilder,
} from '@imx-modules/imx-qbm-dbts';
import { AppConfigService, ClassloggerService, DataSourceToolbarExportMethod, ElementalUiConfigService } from 'qbm';
import { ApiService } from '../api.service';
import { AttestationFeatureGuardService } from '../attestation-feature-guard.service';
import { AttestationPolicy } from './policy-list/attestation-policy';
import { PolicyLoadParameters } from './policy-list/policy-load-parameters.interface';
import { PolicyCopyData } from './policy.interface';

@Injectable({
  providedIn: 'root',
})
export class PolicyService {
  private readonly apiClientMethodFactory = new V2ApiClientMethodFactory();

  constructor(
    private api: ApiService,
    private readonly attFeatureService: AttestationFeatureGuardService,
    private readonly elementalUiConfigService: ElementalUiConfigService,
    private readonly translator: TranslateService,
    private readonly config: AppConfigService,
    private readonly logger: ClassloggerService,
  ) {}

  public get AttestationMatchingObjectsSchema(): EntitySchema {
    return this.api.typedClient.PortalAttestationFilterMatchingobjects.GetSchema();
  }

  public get AttestationPolicySchema(): EntitySchema {
    return this.api.typedClient.PortalAttestationPolicy.GetSchema();
  }

  public get AttestationPolicyEditSchema(): EntitySchema {
    return this.api.typedClient.PortalAttestationPolicyEditInteractive.GetSchema();
  }

  public async getPolicies(
    parameters: PolicyLoadParameters,
    signal?: AbortSignal,
  ): Promise<ExtendedTypedEntityCollection<AttestationPolicy, {}>> {
    const collection = await this.api.typedClient.PortalAttestationPolicy.Get(parameters, { signal });
    return {
      tableName: collection.tableName,
      totalCount: collection.totalCount,
      Data: collection.Data.map((element, index) => new AttestationPolicy(element.GetEntity())),
    };
  }

  public exportPolicies(): DataSourceToolbarExportMethod {
    return {
      getMethod: (withProperties: string, navigationState: CollectionLoadParameters, PageSize?: number) => {
        let method: MethodDescriptor<EntityCollectionData>;
        if (PageSize) {
          method = this.apiClientMethodFactory.portal_attestation_policy_get({
            ...navigationState,
            withProperties,
            PageSize,
            StartIndex: 0,
          });
        } else {
          method = this.apiClientMethodFactory.portal_attestation_policy_get({ ...navigationState, withProperties });
        }
        return new MethodDefinition(method);
      },
    };
  }

  public async getPolicyEditInteractive(uid: string): Promise<ExtendedTypedEntityCollection<PortalAttestationPolicyEditInteractive, {}>> {
    return this.api.typedClient.PortalAttestationPolicyEditInteractive.Get_byid(uid);
  }

  public async buildNewEntity(reference?: PortalAttestationPolicyEdit, filter?: PolicyFilter): Promise<PolicyCopyData> {
    const entities = await this.api.typedClient.PortalAttestationPolicyEditInteractive.Get();
    if (reference == null) {
      return { data: entities.Data[0], pickCategorySkipped: false };
    }

    const pickCategorySkipped = await this.copyPropertiesFrom(entities.Data[0], reference, filter);
    return { data: entities.Data[0], pickCategorySkipped };
  }

  public async getParmData(uidAttestationObject: string): Promise<ParmData[]> {
    return uidAttestationObject ? (await this.api.client.portal_attestation_filter_model_get(uidAttestationObject)).ParmData || [] : [];
  }

  public async getFilterCandidates(parameters: CollectionLoadParameters, uidAttestationParm: string): Promise<EntityCollectionData> {
    return this.api.client.portal_attestation_filter_candidates_get(uidAttestationParm, parameters);
  }

  public async deleteAttestationPolicy(uidAttestationpolicy: string): Promise<ExtendedEntityCollectionData<any>> {
    return this.api.client.portal_attestation_policy_edit_delete(uidAttestationpolicy);
  }

  public async getObjectsForFilter(
    uidAttestatation: string,
    uidPickCategory: string,
    policyfilter: PolicyFilter,
    parameters: CollectionLoadParameters,
  ): Promise<ExtendedTypedEntityCollection<PortalAttestationFilterMatchingobjects, {}>> {
    const data = await this.getObjectsForFilterUntyped(uidAttestatation, uidPickCategory, policyfilter, parameters);

    return new TypedEntityBuilder(PortalAttestationFilterMatchingobjects).buildReadWriteEntities(
      data,
      PortalAttestationFilterMatchingobjects.GetEntitySchema(),
    );
  }

  public async getObjectsForFilterUntyped(
    uidAttestatation: string,
    uidPickCategory: string,
    policyfilter: PolicyFilter,
    parameters: CollectionLoadParameters,
  ): Promise<EntityCollectionData> {
    return this.api.client.portal_attestation_filter_matchingobjects_get(uidAttestatation, {
      uidpickcategory: uidPickCategory,
      ...parameters,
      ...{ policyfilter },
    });
  }

  public async userCanSeePolicy(ident: string): Promise<boolean> {
    const pols = await this.api.client.portal_attestation_policy_edit_get({
      StartIndex: 0,
      PageSize: -1,
      filter: [
        {
          ColumnName: 'Ident_AttestationPolicy',
          CompareOp: CompareOperator.Equal,
          Type: FilterType.Compare,
          Value1: ident,
        },
      ],
    });
    return pols.TotalCount > 0;
  }

  public async createAttestationRun(uidPolicy: string, objectsKeys: string[]): Promise<void> {
    const input: PolicyStartInput = {
      ObjectKeys: objectsKeys,
    };
    return this.api.client.portal_attestation_policy_run_post(uidPolicy, input);
  }

  public canSeeAllAttestations(preProps: string[], features: string[]): boolean {
    return (
      preProps.includes('ATTESTATION') && features.some((elem) => elem === 'Portal_UI_PolicyAdmin' || elem === 'Portal_UI_PolicyOwner')
    );
  }

  public canSeeAttestations(preProps: string[], features: string[]): boolean {
    return preProps.includes('ATTESTATION') && features.some((elem) => elem === 'Portal_UI_PolicyAdmin');
  }

  public async getGroupInfo(parameters: { by?: string; def?: string } & CollectionLoadParameters = {}): Promise<GroupInfoData> {
    const { withProperties, OrderBy, search, ...params } = parameters;

    const test = await this.api.client.portal_attestation_policy_group_get({
      ...params,
      withcount: true,
    });
    return test;
  }

  public async getDataModel(): Promise<DataModel> {
    return this.api.client.portal_attestation_policy_datamodel_get(undefined);
  }

  public async isComplienceFrameworkEnabled(): Promise<boolean> {
    return (await this.attFeatureService.getAttestationConfig()).EnableComplianceFrameworks;
  }

  public getReportDownloadOptions(key: string, display: string): EuiDownloadOptions {
    return {
      ...this.elementalUiConfigService.Config.downloadOptions,
      url: this.config.BaseUrl + new MethodDefinition(this.apiClientMethodFactory.portal_attestation_policy_reportbypolicy_get(key)).path,
      fileName: `${display}.pdf`,
    };
  }

  public async getCasesThreshold(): Promise<number> {
    return (await this.attFeatureService.getAttestationConfig()).PolicyObjectCountThreshold;
  }

  public async getRunCountForPolicy(uid: string): Promise<number> {
    const element = await this.api.typedClient.PortalAttestationRun.Get({
      PageSize: -1,
      filter: [
        {
          Type: FilterType.Compare,
          CompareOp: CompareOperator.Equal,
          ColumnName: 'UID_AttestationPolicy',
          Value1: uid,
        },
      ],
    });
    return element.totalCount;
  }

  private async copyPropertiesFrom(
    entity: PortalAttestationPolicyEdit,
    reference: PortalAttestationPolicyEdit,
    filter?: PolicyFilter,
  ): Promise<boolean> {
    let uidPickCategorySkipped = false;
    for (const key in this.api.typedClient.PortalAttestationPolicyEditInteractive.GetSchema().Columns) {
      if (!key.startsWith('__') && entity[key].GetMetadata().CanEdit()) {
        if (key === 'UID_QERPickCategory' && reference.UID_QERPickCategory.value != null && reference.UID_QERPickCategory.value !== '') {
          uidPickCategorySkipped = true;
        } else {
          await entity[key].Column.PutValueStruct({
            DataValue: reference[key].value,
            DisplayValue: reference[key].Column.GetDisplayValue(),
          });
        }
      }
    }

    // build a new title (shorten it, if maxlength is exceeded)
    let newTitle = `${reference.Ident_AttestationPolicy.value} (${await this.translator.get('#LDS#New').toPromise()})`;
    const max = entity.Ident_AttestationPolicy.GetMetadata().GetMaxLength();
    if (max < newTitle.length) {
      newTitle = newTitle.substring(0, max);
    }

    entity.Ident_AttestationPolicy.value = newTitle;

    if (filter) {
      entity.extendedData = [filter];
    }

    this.logger.trace(this, 'properties copied from policy', reference, filter);
    return uidPickCategorySkipped;
  }
}
