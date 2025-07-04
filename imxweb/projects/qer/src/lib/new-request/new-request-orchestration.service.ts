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

import { ErrorHandler, Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { PortalItshopPatternRequestable, PortalServicecategories, PortalShopServiceitems } from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  CompareOperator,
  EntityCollectionData,
  EntityValue,
  FilterData,
  FilterType,
  FkProviderItem,
  IWriteValue,
  LocalProperty,
  ValueStruct,
} from '@imx-modules/imx-qbm-dbts';

import { TranslateService } from '@ngx-translate/core';
import {
  AuthenticationService,
  DataSourceToolbarComponent,
  DataSourceToolbarSettings,
  EntityService,
  ISessionState,
  LdsReplacePipe,
  SettingsService,
} from 'qbm';
import { PersonService } from '../person/person.service';
import { QerApiService } from '../qer-api-client.service';
import { CurrentProductSource } from './current-product-source';
import { ServiceItemParameters } from './new-request-product/service-item-parameters';
import { SelectedProductSource } from './new-request-selected-products/selected-product-item.interface';
import { NewRequestSelectionService } from './new-request-selection.service';
import { NewRequestTabModel } from './new-request-tab/new-request-tab-model';

@Injectable({
  providedIn: 'root',
})
export class NewRequestOrchestrationService implements OnDestroy {
  //#region Private properties
  private userUid: string;
  private defaultUser: ValueStruct<string>;
  private lastLoggedInUser: string;
  //#endregion

  //#region Public properties

  //#region Recipients
  private recipientsProperty: IWriteValue<string>;
  public get recipients(): IWriteValue<string> {
    return this.recipientsProperty;
  }
  public set recipients(value: IWriteValue<string>) {
    this.recipientsProperty = value;
    this.recipients$.next(value);
  }
  public recipients$ = new BehaviorSubject<IWriteValue<string> | undefined>(undefined);
  //#endregion

  //#region Current Product Source
  private currentProductSourceProperty: CurrentProductSource;
  public get currentProductSource(): CurrentProductSource {
    return this.currentProductSourceProperty;
  }
  public set currentProductSource(value: CurrentProductSource) {
    value.dst.itemStatus = {
      enabled: (prod: PortalShopServiceitems): boolean => {
        return prod.IsRequestable === undefined || prod.IsRequestable?.value;
      },
    };
    this.currentProductSourceProperty = value;
    this.currentProductSource$.next(value);
  }

  public currentProductSource$ = new BehaviorSubject<CurrentProductSource | undefined>(undefined);
  //#endregion

  //#region DST Settings
  public dstSettingsAllProducts: DataSourceToolbarSettings | undefined;
  public dstSettingsPeerGroupProducts: DataSourceToolbarSettings | undefined;
  public dstSettingsPeerGroupOrgs: DataSourceToolbarSettings | undefined;
  public dstSettingsReferenceUserProducts: DataSourceToolbarSettings | undefined;
  public dstSettingsReferenceUserOrgs: DataSourceToolbarSettings | undefined;
  public dstSettingsProductBundles: DataSourceToolbarSettings | undefined;
  //#endregion

  //#region Search Api
  public searchApi$ = new BehaviorSubject<((keywords: string) => Observable<any> | undefined) | undefined>(undefined);

  private disableSearchProperty: boolean;
  public get disableSearch(): boolean {
    return this.disableSearchProperty;
  }
  public set disableSearch(value: boolean) {
    this.disableSearchProperty = value;
    this.disableSearch$.next(value);
  }
  public disableSearch$ = new BehaviorSubject<boolean | undefined>(undefined);

  public keywords: string = '';
  //#endregion

  //#region Navigation State
  private navigationStateProperty: CollectionLoadParameters | ServiceItemParameters;
  public get navigationState(): CollectionLoadParameters | ServiceItemParameters {
    return this.navigationStateProperty;
  }
  public set navigationState(value: CollectionLoadParameters | ServiceItemParameters) {
    this.navigationStateProperty = value;
    this.navigationState$.next(value);
  }
  public navigationState$ = new BehaviorSubject<CollectionLoadParameters | ServiceItemParameters | undefined>(undefined);
  //#endregion

  //#region Selected Tab
  private selectedTabProperty: NewRequestTabModel | undefined;
  public get selectedTab(): NewRequestTabModel | undefined {
    return this.selectedTabProperty;
  }
  public set selectedTab(value: NewRequestTabModel | undefined) {
    this.selectedTabProperty = value;
    // this.dst?.clearSearch();

    this.selectedTab$.next(value);
    // this.clearSearch$.next(true);
  }
  public selectedTab$ = new BehaviorSubject<NewRequestTabModel | undefined>(undefined);
  //#endregion

  // CHECK - Do we need this
  //#region Search
  // public searchInProgress$ = new BehaviorSubject<boolean>(false);
  // public clearSearch$ = new BehaviorSubject<boolean>(false);
  //#endregion

  //#region Selected Chip
  private selectedChipProperty: number;
  public get selectedChip(): number {
    return this.selectedChipProperty;
  }
  public set selectedChip(value: number) {
    this.selectedChipProperty = value;
    this.selectedChip$.next(value);
  }
  public selectedChip$ = new BehaviorSubject<number | undefined>(undefined);
  //#endregion

  //#region Selected Category. If no category is selected (we are on root level) show root level text.
  private selectedCategoryProperty: PortalServicecategories | undefined;
  public get selectedCategory(): PortalServicecategories | undefined {
    return this.selectedCategoryProperty;
  }
  public set selectedCategory(value: PortalServicecategories | undefined) {
    this.selectedCategoryProperty = value;
    this.selectedCategory$.next(value);
  }
  public selectedCategory$ = new BehaviorSubject<PortalServicecategories | undefined>(undefined);
  //#endregion

  //#region Product Selection: Include Child Categories
  private includeChildCategoriesProperty: boolean;
  public get includeChildCategories(): boolean {
    return this.includeChildCategoriesProperty;
  }
  public set includeChildCategories(value: boolean) {
    this.includeChildCategoriesProperty = value;
    this.includeChildCategories$.next(value);
  }
  public includeChildCategories$ = new BehaviorSubject<boolean>(false);
  //#endregion

  //#region Reference User
  private referenceUserProperty: ValueStruct<string> | undefined;
  public get referenceUser(): ValueStruct<string> | undefined {
    return this.referenceUserProperty;
  }
  public set referenceUser(value: ValueStruct<string> | undefined) {
    this.referenceUserProperty = value;
    this.referenceUser$.next(value);
  }
  public referenceUser$ = new BehaviorSubject<ValueStruct<string> | undefined>(undefined);
  //#endregion

  //#region Product Bundle
  private productBundleProperty: PortalItshopPatternRequestable | undefined;
  public get productBundle(): PortalItshopPatternRequestable | undefined {
    return this.productBundleProperty;
  }
  public set productBundle(value: PortalItshopPatternRequestable | undefined) {
    this.productBundleProperty = value;
    this.productBundle$.next(value);
  }
  public productBundle$ = new BehaviorSubject<PortalItshopPatternRequestable | undefined>(undefined);
  //#endregion

  //#region SelectedView
  private selectedViewProperty: SelectedProductSource;
  public get selectedView(): SelectedProductSource {
    return this.selectedViewProperty;
  }
  public set selectedView(value: SelectedProductSource) {
    this.selectedViewProperty = value;
    this.selectedView$.next(value);
  }
  public selectedView$ = new BehaviorSubject<SelectedProductSource | undefined>(undefined);
  //#endregion

  //#region AbortController
  public abortController = new AbortController();

  public serviceCategoryAbortController = new AbortController();
  //#endregion

  //#region loggin State
  private isLoggedInStateProperty: boolean;
  public get isLoggedIn(): boolean {
    return this.isLoggedInStateProperty;
  }
  public set isLoggedIn(value: boolean) {
    this.isLoggedInStateProperty = value;
    this.isLoggedInState$.next(value);
  }
  public isLoggedInState$ = new BehaviorSubject<boolean>(false);

  //#endregion

  constructor(
    authentication: AuthenticationService,
    private readonly qerClient: QerApiService,
    private readonly entityService: EntityService,
    private readonly personProvider: PersonService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly selectionService: NewRequestSelectionService,
    private errorHandler: ErrorHandler,
    private translator: TranslateService,
    private ldsReplace: LdsReplacePipe,
    settingsService: SettingsService,
  ) {
    this.navigationState = { PageSize: settingsService.DefaultPageSize, StartIndex: 0 };
    authentication.onSessionResponse.subscribe(async (session: ISessionState) => {
      this.userUid = session.UserUid || '';

      this.isLoggedIn = session.IsLoggedIn ?? false;

      if (!this.isLoggedIn) {
        this.navigationState = { PageSize: settingsService.DefaultPageSize, StartIndex: 0 };
        return;
      }

      if (this.userUid == null) {
        return;
      }

      if (this.lastLoggedInUser !== this.userUid) {
        this.lastLoggedInUser = this.userUid;
        this.selectionService.clearProducts();
        await this.initRecipients();
      }
    });
  }

  public ngOnDestroy(): void {
    this.referenceUser = undefined;
  }

  public preselectBySource(source: SelectedProductSource, dst: DataSourceToolbarComponent): void {
    if (this.selectionService.selectedProducts == null || dst == null) {
      return;
    }

    dst.preSelection = this.selectionService.selectedProducts.filter((x) => x.source === source).map((x) => x.item);

    dst.selection.clear();
    dst.preSelection.forEach((item) => dst.selection.checked(item));
  }

  public async setDefaultUser(): Promise<void> {
    await this.recipients.Column.PutValueStruct(this.defaultUser);
    this.recipients$.next(this.recipients);
  }

  public async setRecipients(value: ValueStruct<string> | undefined): Promise<void> {
    if (value != null) {
      await this.recipients.Column.PutValueStruct(value);
    }
    this.recipients$.next(this.recipients);
  }

  /**
   * Check through the fk table if this uid could be selected
   * @param uidRecipient
   * @returns
   */
  private async canRecipientBeSet(uidRecipient: string): Promise<boolean> {
    const fkRelations = this.qerClient.typedClient.PortalCartitem.createEntity().UID_PersonOrdered.GetMetadata().GetFkRelations();
    if (fkRelations.length < 1) {
      return false;
    }

    // Assume there is only one relation and filter by the uid
    const filter: FilterData[] = [
      {
        ColumnName: fkRelations[0].ColumnName,
        Type: FilterType.Compare,
        CompareOp: CompareOperator.Equal,
        Value1: uidRecipient,
      },
    ];

    var candidates: EntityCollectionData;
    try {
      candidates = await fkRelations[0].Get({ filter });
    } catch (error) {
      return false;
    }

    // Check if there is data
    if (candidates && candidates.TotalCount > 0) return true;
    else return false;
  }

  public abortCall(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  public abortServiceCategoryCall(): void {
    this.serviceCategoryAbortController.abort();
    this.serviceCategoryAbortController = new AbortController();
  }

  /***
   * Set the recipient to the identity with the specified uid.
   */
  public async setRecipient(uidPerson: string): Promise<void> {
    if (!uidPerson) {
      return;
    }
    // Check if this is a valid person
    const DisplayValue = await this.getPersonDisplay(uidPerson);
    if (!DisplayValue) {
      this.errorHandler.handleError(
        this.ldsReplace.transform(
          this.translator.instant('#LDS#The selected recipient "{0}" does not exist. Select a different recipient.'),
          uidPerson,
        ),
      );
      return;
    }
    // Check if we could set this person through the fkTable
    const canBeSet = await this.canRecipientBeSet(uidPerson);
    if (!canBeSet) {
      this.errorHandler.handleError(
        this.ldsReplace.transform(
          this.translator.instant('#LDS#You cannot request products for the selected identity "{0}". Select a different recipient.'),
          uidPerson,
        ),
      );
      return;
    }
    // Otherwise apply
    this.setRecipients({
      DataValue: uidPerson,
      DisplayValue,
    });
  }

  private async initRecipients(): Promise<void> {
    // define the recipients as a multi-valued property
    const recipientsProp = new LocalProperty();
    recipientsProp.IsMultiValued = true;
    recipientsProp.ColumnName = 'UID_PersonOrdered';
    recipientsProp.MinLen = 1;
    recipientsProp.FkRelation = this.qerClient.typedClient.PortalCartitem.GetSchema().Columns.UID_PersonOrdered.FkRelation;

    const dummyCartItemEntity = this.qerClient.typedClient.PortalCartitem.createEntity().GetEntity();
    const fkProviderItems = this.qerClient.client.getFkProviderItems('portal/cartitem').map((item) => ({
      ...item,
      load: (_, parameters = {}) => item.load(dummyCartItemEntity, parameters),
      getDataModel: async (entity) => item?.getDataModel?.(entity),
      getFilterTree: async (entity, parentKey) => item?.getFilterTree?.(entity, parentKey),
    })) as FkProviderItem[];

    const column = this.entityService.createLocalEntityColumn(recipientsProp, fkProviderItems, { Value: this.userUid });
    this.recipients = new EntityValue(column);

    // preset recipient to the current user
    await this.recipients.Column.PutValueStruct({
      DataValue: this.userUid,
      DisplayValue: await this.getPersonDisplay(this.userUid),
    });

    const uidPerson = this.activatedRoute.snapshot.paramMap.get('UID_Person');
    const DisplayValue = await this.getPersonDisplay(uidPerson);

    if (uidPerson && DisplayValue) {
      await this.recipients.Column.PutValueStruct({
        DataValue: uidPerson,
        DisplayValue,
      });

      // TODO in this case, CanRequestForSomebodyElse is false
    }
    this.defaultUser = {
      DataValue: this.recipients.Column.GetValue(),
      DisplayValue: this.recipients.Column.GetDisplayValue(),
    };
  }

  /**
   * Get the person display via the person provider
   * @param uid
   * @returns
   */
  private async getPersonDisplay(uid: string | null): Promise<string | undefined> {
    if (!uid) {
      return;
    }

    const person = await this.personProvider.get(uid);
    if (person && person.Data.length) {
      return person.Data[0].GetEntity().GetDisplay();
    }
  }
}
