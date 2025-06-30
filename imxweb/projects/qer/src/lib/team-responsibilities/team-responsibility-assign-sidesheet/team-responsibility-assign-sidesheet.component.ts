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

import { Component, Inject, OnInit } from '@angular/core';
import { EUI_SIDESHEET_DATA, EuiLoadingService, EuiSidesheetService } from '@elemental-ui/core';
import {
  PortalAdminPerson,
  PortalPersonReports,
  PortalRespTeamResponsibilities,
  ResponsibilityData,
  ResponsibilityIdentityData,
} from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  DataModel,
  DisplayColumns,
  EntitySchema,
  IClientProperty,
  TypedEntityCollectionData,
} from '@imx-modules/imx-qbm-dbts';
import { AuthenticationService, DataViewInitParameters, DataViewSource, ISessionState } from 'qbm';
import { IdentitiesService } from '../../identities/identities.service';
import { TeamResponsibilitiesService } from '../team-responsibilities.service';

@Component({
  selector: 'imx-team-responsibility-assign-sidesheet',
  templateUrl: './team-responsibility-assign-sidesheet.component.html',
  styleUrl: './team-responsibility-assign-sidesheet.component.scss',
  providers: [DataViewSource],
})
export class TeamResponsibilityAssignSidesheetComponent implements OnInit {
  public entitySchema: EntitySchema;
  public readonly DisplayedColumns = DisplayColumns;
  public selection: PortalPersonReports[] = [];
  public singleSelection = false;
  public managerSelected = false;
  public managerEntity: PortalAdminPerson;
  private displayedColumns: IClientProperty[];
  private dataModel: DataModel;
  private sessionState: ISessionState;
  constructor(
    @Inject(EUI_SIDESHEET_DATA)
    public data: { responsibility: PortalRespTeamResponsibilities[]; reassign: boolean; extendedData: (ResponsibilityData | undefined)[] },
    public dataSource: DataViewSource<PortalPersonReports>,
    private readonly sidesheetService: EuiSidesheetService,
    private readonly identitiesService: IdentitiesService,
    private readonly teamResponsibilitiesService: TeamResponsibilitiesService,
    private readonly busyServiceElemental: EuiLoadingService,
    private readonly authenticationSerivce: AuthenticationService,
  ) {
    this.entitySchema = this.identitiesService.personReportsSchema;
    this.authenticationSerivce.onSessionResponse.subscribe((sessionSate: ISessionState) => {
      this.sessionState = sessionSate;
      this.getManagerEntity();
    });
  }

  async ngOnInit(): Promise<void> {
    this.singleSelection = !!this.data.responsibility[0].UID_SourceColumn.value;
    this.dataModel = await this.identitiesService.getDataModelAdmin();

    this.dataModel = { ...this.dataModel, Filters: this.dataModel.Filters?.filter((filter) => filter.Name !== 'isinactive') };
    this.displayedColumns = [
      this.entitySchema.Columns[this.DisplayedColumns.DISPLAY_PROPERTYNAME],
      this.entitySchema.Columns.UID_Department,
    ];
    this.dataSource.itemStatus = {
      enabled: (item: PortalPersonReports) =>
        !this.otherIdentities().some((otherIdentities) => otherIdentities?.UidPerson === item.GetEntity().GetKeys()[0]) &&
        !this.data.responsibility.some((responsibility) => responsibility.UID_Person.value === item.GetEntity().GetKeys()[0]),
    };
    const dataViewInitParameters: DataViewInitParameters<PortalPersonReports> = {
      execute: (params: CollectionLoadParameters, signal: AbortSignal): Promise<TypedEntityCollectionData<PortalPersonReports>> =>
        this.identitiesService.getReportsOfManager({ ...params, isinactive: '0' }, signal),
      schema: this.entitySchema,
      columnsToDisplay: this.displayedColumns,
      dataModel: this.dataModel,
      selectionChange: (selection: PortalPersonReports[]) => {
        this.selection = selection;
        if (this.singleSelection) {
          this.managerSelected = false;
        }
      },
    };

    this.dataSource.init(dataViewInitParameters);
  }

  public closeSidesheet(): void {
    this.sidesheetService.close();
  }

  public async assignMore(): Promise<void> {
    const overlayRef = this.busyServiceElemental.show();
    const selection: (PortalAdminPerson | PortalPersonReports)[] = this.selection;
    if (this.managerSelected) {
      selection.push(this.managerEntity);
    }
    try {
      if (this.data.reassign) {
        await this.teamResponsibilitiesService.reassignResponsibilities(this.data.responsibility, selection, this.data.extendedData);
      } else {
        await this.teamResponsibilitiesService.assignResponsibility(this.data.responsibility[0], selection, this.data.extendedData[0]);
      }
    } finally {
      this.busyServiceElemental.hide(overlayRef);
      this.sidesheetService.close(true);
    }
  }

  public otherIdentities(): ResponsibilityIdentityData[] {
    let otherIdentities: ResponsibilityIdentityData[] = [];
    this.data.extendedData.map((extendedData) => otherIdentities.push(...(extendedData?.OtherIdentities || [])));
    return otherIdentities;
  }

  public onManagerSelection(): void {
    if (this.singleSelection) {
      this.dataSource.selection.clear();
    }
  }

  public get assignButtonEnabled(): boolean {
    return !!this.selection.length || this.managerSelected;
  }

  private async getManagerEntity(): Promise<void> {
    this.managerEntity = await this.identitiesService.getAdminPerson(this.sessionState.UserUid!);
  }
}
