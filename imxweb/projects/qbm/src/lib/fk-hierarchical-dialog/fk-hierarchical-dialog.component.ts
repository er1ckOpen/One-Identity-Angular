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

import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EUI_SIDESHEET_DATA, EuiLoadingService, EuiSidesheetRef } from '@elemental-ui/core';
import { Subscription } from 'rxjs';

import {
  CollectionLoadParameters,
  CompareOperator,
  DataModelFilter,
  DbObjectKey,
  FilterType,
  IEntity,
  IForeignKeyInfo,
  TypedEntity,
} from '@imx-modules/imx-qbm-dbts';
import { MetadataService } from '../base/metadata.service';
import { ClassloggerService } from '../classlogger/classlogger.service';
import { ConfirmationService } from '../confirmation/confirmation.service';
import { FilterTreeParameter } from '../data-source-toolbar/data-model/filter-tree-parameter';
import { DataTreeWrapperComponent } from '../data-tree-wrapper/data-tree-wrapper.component';
import { ForeignKeyPickerData } from '../fk-advanced-picker/foreign-key-picker-data.interface';
import { HierarchicalCandidate } from './hierarchical-candidate';
import { HierarchicalFkDatabase } from './hierarchical-fk-database';

@Component({
  selector: 'imx-fk-hierarchical-dialog',
  templateUrl: './fk-hierarchical-dialog.component.html',
  styleUrls: ['./fk-hierarchical-dialog.component.scss'],
})
export class FkHierarchicalDialogComponent implements OnInit, OnDestroy {
  public readonly hierarchyService: HierarchicalFkDatabase;
  @ViewChild(DataTreeWrapperComponent) public fkTree: DataTreeWrapperComponent;

  public selectedEntities: IEntity[] = [];
  public tableNames: string[];
  public selectedEntityCandidates: TypedEntity[] = [];
  public filters: DataModelFilter[] = [];

  public entitySchema = HierarchicalCandidate.GetEntitySchema();
  public filterTree: FilterTreeParameter;

  private isChanged = false;
  private closeClickSubscription: Subscription;

  constructor(
    public sidesheetRef: EuiSidesheetRef,
    private busyService: EuiLoadingService,
    private logger: ClassloggerService,
    private readonly confirmation: ConfirmationService,
    public readonly metadataProvider: MetadataService,
    @Inject(EUI_SIDESHEET_DATA) public readonly data: ForeignKeyPickerData,
  ) {
    this.closeClickSubscription = this.sidesheetRef.closeClicked().subscribe(async () => {
      if (!this.isChanged || (await this.confirmation.confirmLeaveWithUnsavedChanges())) {
        this.sidesheetRef.close();
      }
    });

    this.hierarchyService = new HierarchicalFkDatabase(busyService);
    if (data.fkRelations) {
      this.hierarchyService.fkTable = data.fkRelations.find((fkr) => fkr.TableName === data.selectedTableName) || data.fkRelations[0];
    }

    this.filterTree = { filterMethode: async (parent) => this.hierarchyService.fkTable.GetFilterTree(parent) };
  }

  public ngOnDestroy(): void {
    this.closeClickSubscription.unsubscribe();
  }

  public async ngOnInit(): Promise<void> {
    await this.getPreselectedEntities();
    this.filters = (await this.hierarchyService?.fkTable?.GetDataModel())?.Filters ?? [];
    this.tableNames = this.data.fkRelations?.map((elem) => elem.TableName);
  }

  /**
   * @ignore
   */
  public async tableChanged(): Promise<void> {
    this.fkTree?.reload();
  }

  public clearSelection(): void {
    this.selectedEntities = [];
    this.selectedEntityCandidates = [];
    this.fkTree?.clearSelection();
    this.isChanged = true;
  }

  public async onNodeSelected(entity: IEntity): Promise<void> {
    if (!this.data.isMultiValue) {
      this.selectedEntities = [entity];
      this.applySelection();
    }
  }

  public selectedNodesChanged(): void {
    this.selectedEntityCandidates = this.selectedEntities.map((elem) => new HierarchicalCandidate(elem));

    this.isChanged = true;
  }

  /**
   * @ignore
   * Assigns foreign key(s) by passing the value and the displayvalue to the parent component
   */
  public applySelection(): void {
    this.sidesheetRef.close({
      table: this.data.fkRelations.find((fkr) => fkr.TableName === this.data.selectedTableName) || this.data.fkRelations[0],
      candidates: this.selectedEntities.map((entity) => {
        return {
          DataValue: this.getKey(entity),
          DisplayValue: entity.GetDisplay(),
          displayLong: entity.GetDisplayLong(),
        };
      }),
    });
  }

  private getKey(entity: IEntity): string | undefined {
    if (this.data.fkRelations && this.data.fkRelations.length > 1) {
      const xObjectKeyColumn = entity.GetColumn('XObjectKey');
      return xObjectKeyColumn ? xObjectKeyColumn.GetValue() : undefined;
    }

    try {
      const parentColumnValue = entity.GetColumn(this.data.fkRelations[0].ColumnName)?.GetValue() ?? '';
      if (parentColumnValue !== '') {
        this.logger.trace(this, 'Use value from explicit parent column');
        return parentColumnValue;
      }
    } catch (error) {
      this.logger.trace(this, 'tried to get parent column but failed', error);
    }

    const keys = entity.GetKeys();
    return keys && keys.length ? keys[0] : undefined;
  }

  private async getPreselectedEntities(): Promise<void> {
    if (this.data.fkRelations && this.data.fkRelations.length > 0 && this.data.idList && this.data.idList.length > 0) {
      if (this.busyService.overlayRefs.length === 0) {
        this.busyService.show();
      }

      try {
        const preselectedTemp: TypedEntity[] = [];
        this.selectedEntities = [];

        this.logger.debug(this, 'Getting preselected entities');

        for (const key of this.data.idList) {
          let table: IForeignKeyInfo | undefined;
          if (this.data.fkRelations.length > 1) {
            const tableName = DbObjectKey.FromXml(key).TableName;
            table = this.data.fkRelations.find((fkr) => fkr.TableName === tableName);
          }

          table = table || this.data.fkRelations[0];

          const navigationState: CollectionLoadParameters = {
            filter: [
              {
                ColumnName: table.ColumnName,
                Type: FilterType.Compare,
                CompareOp: CompareOperator.Equal,
                Value1: key,
              },
            ],
          };
          this.logger.debug(this, 'Getting preselected entity with navigation state', navigationState);

          const elements = await table.Get(navigationState);
          if (elements.Entities?.length) {
            const entity = await this.hierarchyService.buildEntityWithHasChilderen(elements.Entities[0], elements.Hierarchy);
            preselectedTemp.push(entity);
          }
        }

        this.selectedEntities = preselectedTemp.map((entity) => entity.GetEntity());
        this.selectedEntityCandidates = this.selectedEntities.map((elem) => new HierarchicalCandidate(elem));
        this.logger.debug(this, `Retrieved ${this.selectedEntities.length} preselected entities`);
      } finally {
        this.busyService.hide();
      }
    }
  }
}
