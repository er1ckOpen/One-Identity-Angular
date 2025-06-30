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

import { Component, OnDestroy, OnInit } from '@angular/core';

import { AppConfigService } from 'qbm';
import { IssueItem } from '../service-issues/service-issues.models';
import { NotificationsService } from './notifications.service';

@Component({
  selector: 'imx-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss', '../issue-tiles.scss'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  public get Notifications(): IssueItem[] {
    return this.notifications.items;
  }

  constructor(
    public notifications: NotificationsService,
    private appConfigService: AppConfigService,
  ) {}

  public ngOnInit(): void {
    this.notifications.subscribe(this.appConfigService.Config.NotificationUpdateInterval);
  }

  public ngOnDestroy(): void {
    this.notifications.unsubscribe();
  }
}
