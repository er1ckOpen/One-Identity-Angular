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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EuiLoadingService, EuiSidesheetService } from '@elemental-ui/core';
import { ViewConfigData } from '@imx-modules/imx-api-qer';
import {
  EntityWriteDataBulk,
  PortalRespUnsgroup,
  PortalTargetsystemUnsGroup,
  PortalTargetsystemUnsGroupServiceitem,
  PortalTargetsystemUnsSystem,
} from '@imx-modules/imx-api-tsb';
import {
  CollectionLoadParameters,
  DataModel,
  DbObjectKey,
  DisplayColumns,
  EntitySchema,
  IClientProperty,
  TypedEntityCollectionData,
  ValType,
} from '@imx-modules/imx-qbm-dbts';
import { TranslateService } from '@ngx-translate/core';
import {
  BusyService,
  ClassloggerService,
  DataSourceToolbarFilter,
  DataSourceToolbarViewConfig,
  DataViewInitParameters,
  DataViewSource,
  HelpContextualValues,
  SideNavigationComponent,
  SnackBarService,
  calculateSidesheetWidth,
} from 'qbm';
import { SourceDetectiveSidesheetComponent, SourceDetectiveSidesheetData, SourceDetectiveType, ViewConfigService } from 'qer';
import { Subscription } from 'rxjs';

import { ContainerTreeDatabaseWrapper } from '../container-list/container-tree-database-wrapper';
import { DeHelperService } from '../de-helper.service';
import { GroupSidesheetComponent } from './group-sidesheet/group-sidesheet.component';
import { GroupSidesheetData } from './groups.models';
import { GroupsService } from './groups.service';
import { ProductOwnerSidesheetComponent } from './product-owner-sidesheet/product-owner-sidesheet.component';

@Component({
  selector: 'imx-data-explorer-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  providers: [DataViewSource],
})
export class DataExplorerGroupsComponent implements OnInit, OnDestroy, SideNavigationComponent {
  @Input() public unsAccountIdFilter: string;
  @Input() public sidesheetWidth = '65%';
  @Input() public applyIssuesFilter = false;
  @Input() public issuesFilterMode: string;
  @Input() public targetSystemData?: PortalTargetsystemUnsSystem[];
  @Input() public isAdmin: boolean;
  @Input() public uidPerson = '';
  @Input() public usedInSidesheet = false;
  @Input() public contextId: HelpContextualValues;
  public filterOptions: DataSourceToolbarFilter[] = [];
  public treeDbWrapper: ContainerTreeDatabaseWrapper;
  public requestableBulkUpdateCtrl = new UntypedFormControl(true);
  public entitySchemaUnsGroup: EntitySchema;
  public readonly DisplayColumns = DisplayColumns;
  public selectedGroupsForUpdate: Array<PortalTargetsystemUnsGroup | PortalRespUnsgroup> = [];
  public data: any;

  public busyService = new BusyService();
  private viewConfigPath: string;
  private viewConfig: DataSourceToolbarViewConfig;

  public readonly itemStatus = {
    enabled: (item: PortalTargetsystemUnsGroup): boolean => {
      return item.UID_AccProduct?.value !== '';
    },
  };

  private displayedColumns: IClientProperty[] = [];
  private authorityDataDeleted$: Subscription;

  private dataModel: DataModel;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly sideSheet: EuiSidesheetService,
    private readonly busyServiceElemental: EuiLoadingService,
    private readonly logger: ClassloggerService,
    private readonly groupsService: GroupsService,
    private viewConfigService: ViewConfigService,
    private readonly dataHelper: DeHelperService,
    private readonly translate: TranslateService,
    private readonly snackbar: SnackBarService,
    public dataSource: DataViewSource<PortalTargetsystemUnsGroup | PortalRespUnsgroup>,
  ) {
    this.isAdmin = this.route.snapshot?.url[0]?.path === 'admin';
    this.entitySchemaUnsGroup = this.groupsService.unsGroupsSchema(this.isAdmin);
    this.authorityDataDeleted$ = this.dataHelper.authorityDataDeleted.subscribe(() => this.dataSource.updateState());
    this.treeDbWrapper = new ContainerTreeDatabaseWrapper(this.busyService, dataHelper);
  }

  public async ngOnInit(): Promise<void> {
    this.entitySchemaUnsGroup = this.groupsService.unsGroupsSchema(this.isAdmin);

    this.displayedColumns = [
      this.entitySchemaUnsGroup.Columns[DisplayColumns.DISPLAY_PROPERTYNAME],
      this.entitySchemaUnsGroup.Columns.Requestable,
    ];

    if (this.entitySchemaUnsGroup.Columns.XMarkedForDeletion) {
      this.displayedColumns.push(this.entitySchemaUnsGroup.Columns.XMarkedForDeletion);
    }

    if (this.unsAccountIdFilter) {
      this.displayedColumns.push({ ColumnName: 'action', Type: ValType.String });
    }
    const isBusy = this.busyService.beginBusy();

    try {
      this.dataSource.itemStatus = this.itemStatus;
      this.dataModel = await this.groupsService.getDataModel(this.isAdmin);
      this.filterOptions = this.dataModel.Filters ?? [];
      this.viewConfigPath = this.isAdmin || this.unsAccountIdFilter ? 'targetsystem/uns/group' : 'resp/unsgroup';
      this.viewConfig = await this.viewConfigService.getInitialDSTExtension(this.dataModel, this.viewConfigPath);
      const dataViewInitParameters: DataViewInitParameters<PortalTargetsystemUnsGroup | PortalRespUnsgroup> = {
        execute:
          this.isAdmin || this.unsAccountIdFilter // Wenn wir filtern, muss auch der Admin-Endpoint genutzt werden
            ? (params: CollectionLoadParameters, signal: AbortSignal): Promise<TypedEntityCollectionData<PortalTargetsystemUnsGroup>> => {
                if (this.unsAccountIdFilter) {
                  params = { ...params, uid_unsaccount: this.unsAccountIdFilter };
                }
                return this.groupsService.getGroups(params, signal);
              }
            : (params: CollectionLoadParameters, signal: AbortSignal): Promise<TypedEntityCollectionData<PortalRespUnsgroup>> =>
                this.groupsService.getGroupsResp(params, signal),
        schema: this.entitySchemaUnsGroup,
        columnsToDisplay: this.displayedColumns,
        dataModel: this.dataModel,
        exportFunction: this.isAdmin || this.unsAccountIdFilter ? this.groupsService.exportGroups() : this.groupsService.exportGroupsResp(),
        viewConfig: this.viewConfig,
        highlightEntity: (identity: PortalTargetsystemUnsGroup | PortalRespUnsgroup) => {
          this.onGroupChanged(identity);
        },
        filterTree: {
          filterMethode: async (parentkey) => {
            return this.groupsService.getFilterTree({
              parentkey,
              container: this.dataSource.state().container,
              system: this.dataSource.state().system,
              uid_unsaccount: this.unsAccountIdFilter,
            });
          },
          multiSelect: false,
        },
        selectionChange: (selection: Array<PortalTargetsystemUnsGroup | PortalRespUnsgroup>) => this.onGroupSelected(selection),
      };
      this.dataSource.init(dataViewInitParameters);
    } finally {
      isBusy.endBusy();
    }
  }

  public ngOnDestroy(): void {
    if (this.authorityDataDeleted$) {
      this.authorityDataDeleted$.unsubscribe();
    }
  }

  public async updateConfig(config: ViewConfigData): Promise<void> {
    await this.viewConfigService.putViewConfig(config);
    this.viewConfig = await this.viewConfigService.getDSTExtensionChanges(this.viewConfigPath);
    this.dataSource.viewConfig.set(this.viewConfig);
  }

  public async deleteConfigById(id: string): Promise<void> {
    await this.viewConfigService.deleteViewConfig(id);
    this.viewConfig = await this.viewConfigService.getDSTExtensionChanges(this.viewConfigPath);
    this.dataSource.viewConfig.set(this.viewConfig);
  }

  public get itemsAreNotRequestable(): boolean {
    return this.selectedGroupsForUpdate.every((elem) => !elem.Requestable.value);
  }

  public get itemsAreRequestable(): boolean {
    return this.selectedGroupsForUpdate.every((elem) => elem.Requestable.value);
  }

  public async onGroupChanged(group: PortalTargetsystemUnsGroup | PortalRespUnsgroup): Promise<void> {
    if (this.unsAccountIdFilter) {
      return;
    }

    this.logger.debug(this, `Selected group changed`);
    this.logger.trace(this, `New group selected`, group);

    let data: GroupSidesheetData;
    const hideOverlayRef = this.busyServiceElemental.show();

    try {
      const objKey = DbObjectKey.FromXml(group.GetEntity().GetColumn('XObjectKey').GetValue());

      const uidAccProduct = group.GetEntity().GetColumn('UID_AccProduct').GetValue();

      data = {
        uidAccProduct,
        unsGroupDbObjectKey: objKey,
        group: await this.groupsService.getGroupDetailsInteractive(objKey, 'UID_AccProduct'),
        groupServiceItem: await this.groupsService.getGroupServiceItem(uidAccProduct),
        isAdmin: this.isAdmin,
      };
    } finally {
      this.busyServiceElemental.hide(hideOverlayRef);
    }

    this.viewGroup(data);
  }

  public onGroupSelected(selected: Array<PortalTargetsystemUnsGroup | PortalRespUnsgroup>): void {
    this.selectedGroupsForUpdate = selected;
  }

  public async viewSource(event: Event, item: PortalTargetsystemUnsGroup): Promise<void> {
    event.stopPropagation();

    const uidPerson = this.uidPerson;
    const objKey = DbObjectKey.FromXml(item.XObjectKey.value);

    const data: SourceDetectiveSidesheetData = {
      UID_Person: uidPerson,
      Type: SourceDetectiveType.MembershipOfSystemEntitlement,
      UID: objKey.Keys[0],
      TableName: objKey.TableName,
    };
    this.sideSheet.open(SourceDetectiveSidesheetComponent, {
      title: await this.translate.get('#LDS#Heading View Assignment Analysis').toPromise(),
      subTitle: item.GetEntity().GetDisplay(),
      padding: '0px',
      width: calculateSidesheetWidth(),
      disableClose: false,
      testId: 'system-entitlement-role-membership-details',
      data,
    });
  }

  public async bulkUpdateSelected(request: boolean): Promise<void> {
    const updateData: EntityWriteDataBulk = {
      Keys: [],
      Data: [
        {
          Name: PortalTargetsystemUnsGroupServiceitem.GetEntitySchema().Columns.IsInActive.ColumnName,
          // Inverse value as actual property is 'Not available'
          Value: !request,
        },
      ],
    };
    return this.updateSelectedGroups(updateData);
  }

  public async bulkUpdateOwner(): Promise<void> {
    const selectedOwner = await this.sideSheet
      .open(ProductOwnerSidesheetComponent, {
        title: await this.translate.get('#LDS#Heading Assign Product Owner').toPromise(),
        subTitle: this.selectedGroupsForUpdate.length === 1 ? this.selectedGroupsForUpdate[0].GetEntity().GetDisplay() : '',
        padding: '0px',
        width: `max(650px, ${this.sidesheetWidth})`,
        icon: 'usergroup',
        testId: 'system-entitlements-assign-product-owner',
        data: await this.groupsService.getGroupServiceItem(this.selectedGroupsForUpdate[0].UID_AccProduct.value),
      })
      .afterClosed()
      .toPromise();

    if (selectedOwner) {
      return this.updateOwnerForSelectedGroups(selectedOwner);
    }
  }

  private async updateOwnerForSelectedGroups(selectedOwner: { uidPerson?: string; uidRole?: string }): Promise<void> {
    let confirmMessage = '';
    if (this.busyServiceElemental.overlayRefs.length === 0) {
      this.busyServiceElemental.show();
    }
    try {
      confirmMessage = await this.groupsService.updateMultipleOwner(
        this.selectedGroupsForUpdate.map((elem) => elem.UID_AccProduct.value),
        selectedOwner,
      );
    } finally {
      this.busyServiceElemental.hide();
    }

    if (confirmMessage) {
      this.snackbar.open({ key: confirmMessage });
    }
    return this.dataSource.updateState();
  }

  private async updateSelectedGroups(updateData: EntityWriteDataBulk): Promise<void> {
    this.selectedGroupsForUpdate.forEach((group: PortalTargetsystemUnsGroup) => {
      const serviceItemUid = group?.UID_AccProduct.value;
      if (serviceItemUid?.length && updateData.Keys) {
        updateData.Keys.push([serviceItemUid]);
      }
    });
    if (this.busyServiceElemental.overlayRefs.length === 0) {
      this.busyServiceElemental.show();
    }

    try {
      await this.groupsService.bulkUpdateGroupServiceItems(updateData);
      await this.dataSource.updateState();
      this.dataSource.selection.clear();
      this.requestableBulkUpdateCtrl.setValue(true, { emitEvent: false });
    } finally {
      this.busyServiceElemental.hide();
    }
  }

  private async viewGroup(data: GroupSidesheetData): Promise<void> {
    const sidesheetRef = this.sideSheet.open(GroupSidesheetComponent, {
      title: await this.translate.get('#LDS#Heading Edit System Entitlement').toPromise(),
      subTitle: data.group.GetEntity().GetDisplay(),
      padding: '0px',
      width: calculateSidesheetWidth(1250, 0.7),
      icon: 'usergroup',
      data,
      testId: 'edit-system-entitlement-sidesheet',
      disableClose: true,
    });
    // After the sidesheet closes, reload the current data to refresh any changes that might have been made
    sidesheetRef.afterClosed().subscribe(() => this.dataSource.updateState());
  }
}
