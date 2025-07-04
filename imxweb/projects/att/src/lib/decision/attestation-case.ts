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

import { AttCaseDataRead, AttestationCaseData, AttestationCaseUiData, PortalAttestationApprove } from '@imx-modules/imx-api-att';
import { IEntity, IEntityColumn, TypedEntity } from '@imx-modules/imx-qbm-dbts';
import { BaseCdr, ColumnDependentReference } from 'qbm';
import { ParameterDataContainer, WorkflowDataWrapper } from 'qer';
import { AttestationCaseAction } from '../attestation-action/attestation-case-action.interface';

export class AttestationCase extends PortalAttestationApprove implements AttestationCaseAction {
  public get decisionOffset(): number {
    return this.directDecisionTarget - this.DecisionLevel.value;
  }
  public get isOverdue(): boolean {
    return this.ToSolveTill.value && new Date().valueOf() > new Date(this.ToSolveTill.value).valueOf();
  }
  public get attestationParameters(): IEntityColumn[] {
    return this.parameterDataContainer.columns;
  }
  public get canAskAQuestion(): boolean {
    return !!this.data?.CanAskForHelp;
  }

  public readonly propertyInfo: ColumnDependentReference[];
  public readonly key: string;
  public readonly data: AttestationCaseData | undefined;
  public readonly typedEntity: TypedEntity; // from interface AttestationAction
  public readonly propertiesForAction: IEntityColumn[]; // from interface AttestationAction
  public readonly uiData: AttestationCaseUiData | undefined;

  public get hasPolicyViolation(): boolean {
    return !!this.data?.PolicyViolations?.length;
  }
  private directDecisionTarget = 0;

  private readonly workflowWrapper: WorkflowDataWrapper;

  constructor(
    private readonly baseObject: PortalAttestationApprove,
    private readonly parameterDataContainer: ParameterDataContainer,
    extendedCollectionData: { index: number } & AttCaseDataRead,
  ) {
    super(baseObject.GetEntity());

    this.key = this.baseObject.GetEntity().GetKeys()[0];
    this.typedEntity = this;
    this.propertiesForAction = [this.ToSolveTill.Column, this.UID_AttestationPolicy.Column];

    const properties = [
      this.IsNotApprovedBefore,
      this.StructureDisplay1,
      this.StructureDisplay2,
      this.StructureDisplay3,
      this.PropertyInfo1,
      this.PropertyInfo2,
      this.PropertyInfo3,
      this.PropertyInfo4,
      this.ToSolveTill,
      this.RiskIndex,
      this.UID_AttestationPolicy,
    ];

    if (this.IsCrossFunctional.value === true) {
      properties.push(this.IsCrossFunctional);
    }

    this.propertyInfo = properties
      .filter((property) => property.value != null && property.value !== '')
      .map((property) => new BaseCdr(property.Column, extendedCollectionData[property.Column.ColumnName]));

    this.data = extendedCollectionData.Data
      ? { ...extendedCollectionData.Data[extendedCollectionData.index], WorkflowSteps: extendedCollectionData.WorkflowSteps }
      : undefined;
    this.uiData = extendedCollectionData.UiData ? extendedCollectionData.UiData[extendedCollectionData.index] : undefined;

    if (this.data) {
      this.workflowWrapper = new WorkflowDataWrapper({ ...this.data, WorkflowSteps: extendedCollectionData.WorkflowSteps });
    }
  }

  public updateDirectDecisionTarget(workflow: IEntity): void {
    this.directDecisionTarget = workflow.GetColumn('LevelNumber').GetValue();
  }

  public async commit(reload = true): Promise<void> {
    this.baseObject.extendedData = this.parameterDataContainer.getEntityWriteDataColumns();
    if (
      this.baseObject.extendedData.DialogParameter?.[0].length > 0 ||
      this.baseObject.extendedData.ComponentParameter?.[0].length > 0 ||
      !!this.baseObject.GetEntity().GetDiffData().Data?.length
    ) {
      try {
        await this.baseObject.GetEntity().Commit(reload);
      } catch (error) {
        await this.baseObject.GetEntity().DiscardChanges();
        this.baseObject.extendedData = {};
        throw error;
      }
    }
  }

  public canDenyApproval(userUid: string): boolean {
    // TODO later: not(IsReadOnly())

    return !this.IsReserved.value && this.workflowWrapper?.canDenyDecision(userUid, this.DecisionLevel.value);
  }

  public getLevelNumbers(userUid: string): number[] {
    return this.workflowWrapper?.getDirectSteps(userUid, this.DecisionLevel.value)?.map((step) => step + this.DecisionLevel.value);
  }

  public canRerouteDecision(userUid: string): boolean {
    return this.workflowWrapper?.getDirectSteps(userUid, this.DecisionLevel.value)?.some((value) => value !== 0);
  }

  public canAddApprover(userUid: string): boolean {
    return !this.IsReserved.value && this.workflowWrapper?.isAdditionalAllowed(userUid, this.DecisionLevel.value);
  }

  public canDelegateDecision(userUid: string): boolean {
    const instead =
      userUid === ''
        ? this.workflowWrapper?.isInsteadOfAllowedForEscalation(this.UID_QERWorkingMethod.value, this.DecisionLevel.value)
        : this.workflowWrapper?.isInsteadOfAllowed(userUid, this.DecisionLevel.value);
    return !this.IsReserved.value && instead;
  }

  public hasAskedLastQuestion(userUid: string): boolean {
    return this.workflowWrapper.userAskedLastQuestion(userUid, this.DecisionLevel.value);
  }

  public canWithdrawAddApprover(userUid: string): boolean {
    return this.workflowWrapper?.canRevokeAdditionalApprover(userUid, this.DecisionLevel.value);
  }

  public canEscalateDecision(userUid: string): boolean {
    return this.UID_PersonHead.value === userUid && this.workflowWrapper.canEscalateDecision(this.DecisionLevel.value);
  }
}
