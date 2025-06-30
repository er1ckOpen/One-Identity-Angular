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

import { Component, effect, ElementRef, SecurityContext, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { QpmIntegrationLinks } from '@imx-modules/imx-api-qer';
import { ProjectConfigurationService } from '../project-configuration/project-configuration.service';
import { QerApiService } from '../qer-api-client.service';

@Component({
  templateUrl: './qpm-integration.component.html',
  styleUrls: ['./qpm-integration.component.scss'],
})
export class QpmIntegrationComponent {
  private passwordLink = viewChild.required<ElementRef>('passwordLink');
  private qaLink = viewChild.required<ElementRef>('qaLink');
  private alertLink = viewChild.required<ElementRef>('alertLink');

  constructor(
    private readonly router: Router,
    private readonly qerApiService: QerApiService,
    private readonly projConfig: ProjectConfigurationService,
    private readonly sanitizer: DomSanitizer,
  ) {
    effect(() => {
      this.projConfig.getConfig().then((config) => {
        if (config.PasswordConfig?.QpmBaseUrl != null) {
          this.qerApiService.client.portal_password_qpmlinks_get().then((links) => {
            this.links = links;
            this.dataReady = true;
            this.passwordLink().nativeElement.href = this.sanitizeUrl(this.links.ChangePassword || '');
            this.qaLink().nativeElement.href = this.sanitizeUrl(this.links.EditProfile || '');
            this.alertLink().nativeElement.href = this.sanitizeUrl(this.links.ChangeSettings || '');
          });
        } else {
          this.dataReady = true;
        }
      });
    });
  }

  dataReady: boolean;
  links: QpmIntegrationLinks;
  profileText =
    '#LDS#Configure your personal Questions and Answers profile that will allow you to reset your forgotten password or unlock your account in the future.';
  alertText = '#LDS#Select events that you want to be notified about, such as when your password was changed or your account was locked.';

  private sanitizeUrl(url: string): string {
    return this.sanitizer.sanitize(SecurityContext.URL, url)!;
  }
}
