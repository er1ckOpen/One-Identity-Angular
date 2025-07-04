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

import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { EUI_SIDESHEET_DATA, EuiSidesheetRef } from '@elemental-ui/core';
import { Subscription } from 'rxjs';

import { ITShopConfig } from '@imx-modules/imx-api-qer';
import { AuthenticationService, ISessionState } from 'qbm';
import { QerPermissionsService } from '../../admin/qer-permissions.service';
import { ItshopService } from '../../itshop/itshop.service';
import { Approval } from '../approval';
import { WorkflowActionService } from '../workflow-action/workflow-action.service';

@Component({
  selector: 'imx-approvals-sidesheet',
  templateUrl: './approvals-sidesheet.component.html',
  styleUrls: ['./approvals-sidesheet.component.scss'],
})
export class ApprovalsSidesheetComponent implements OnDestroy, OnInit {
  public readonly hasPeerGroupAnalysis: boolean;

  public currentUserId: string;
  public isChiefApprover: boolean;

  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(EUI_SIDESHEET_DATA)
    public readonly data: {
      pwo: Approval;
      itShopConfig?: ITShopConfig;
      fromInquiry: boolean;
    },
    public readonly actionService: WorkflowActionService,
    private readonly sideSheetRef: EuiSidesheetRef,
    itshop: ItshopService,
    authentication: AuthenticationService,
    private readonly permission: QerPermissionsService,
  ) {
    this.subscriptions.push(this.actionService.applied.subscribe(() => this.sideSheetRef.close()));
    this.subscriptions.push(
      authentication.onSessionResponse.subscribe((state: ISessionState) => (this.currentUserId = state.UserUid || '')),
    );

    if (this.data.pwo.pwoData?.WorkflowHistory) {
      this.hasPeerGroupAnalysis =
        this.data.pwo.pwoData.WorkflowHistory.Entities?.some((item) =>
          ['EXWithPeerGroupAnalysis', 'Peer group analysis'].includes(item.Columns?.Ident_PWODecisionStep?.Value),
        ) ?? false;
    }
  }
  public async ngOnInit(): Promise<void> {
    this.isChiefApprover = await this.permission.isCancelPwO();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public canResetReservation() {
    return (
      this.data.pwo.IsReserved.value && ((this.data.pwo.hasAskedLastQuestion && !this.data.pwo.hasOpenQuestions) || this.isChiefApprover)
    );
  }

  public async acceptTermsOfUse(): Promise<void> {
    /* TODO #241926
    lock DoApprove as long as MustApproveTermsOfUse is true for a PWOToDecide

    QER_ITShop_AcceptTermsOfUse({
        HeaderText: '#LDS#You must accept the terms of use before proceeding.',
        AccProductFilter: this.SelectedRequest.UID_AccProduct.value,
        OnTermsOfUseAccepted: () => {
            this.session.Client.termsofuse_accept_post(bla);
            // TODO later: trigger reload of decision history for this request
            this.router.navigate(["form:Approvals"], {});
        }
    });
    */
  }

  public canDenyApproval(): boolean {
    return this.data.pwo.canDenyApproval(this.currentUserId);
  }

  public showEntireRequest(): void {
    /* TODO later
    RedirectFormModule({ "ScriptItemUID": "RedirectForm1", "ID": "VI_ITShop_PWOOverviewForShoppingCartOrder" }, () => {
        VirtualTableMapping({ "ScriptItemUID": "VirtualTableMapping7", "VirtualTable": "PersonWantsOrg", "DataTable": "PWOToDecide" });
    });
    */
  }

  public modifyPriority(): void {
    // TODO later
  }

  public LdsKeyApprove = '#LDS#Based on the peer group analysis, it is recommended that you approve this request.';
  public LdsKeyDeny = '#LDS#Based on the peer group analysis, it is recommended that you deny this request.';
}
