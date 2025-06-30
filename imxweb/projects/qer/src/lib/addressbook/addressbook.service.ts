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

import { V2ApiClientMethodFactory } from '@imx-modules/imx-api-qer';
import { CollectionLoadParameters, EntityCollectionData, MethodDefinition, MethodDescriptor, TypedEntity } from '@imx-modules/imx-qbm-dbts';
import { DataSourceToolbarExportMethod } from 'qbm';
import { PersonService } from '../person/person.service';
import { AddressbookDetail } from './addressbook-detail/addressbook-detail.interface';

@Injectable({
  providedIn: 'root',
})
export class AddressbookService {
  constructor(private readonly personService: PersonService) { }

  public async getDetail(personAll: TypedEntity, columnNames: string[]): Promise<AddressbookDetail> {
    const personUid = personAll.GetEntity().GetKeys()[0];

    const personDetailEntity = (await this.personService.get(personUid)).Data[0].GetEntity();

    const entitySchema = this.personService.schemaPersonUid;

    return {
      columns: columnNames
        .filter((columnName) => entitySchema.Columns[columnName])
        .map((columnName) => personDetailEntity.GetColumn(columnName)),
      personUid,
    };
  }

  public exportPerson(): DataSourceToolbarExportMethod {
    const factory = new V2ApiClientMethodFactory();
    return {
      getMethod: (withProperties: string, navigationState: CollectionLoadParameters, PageSize?: number) => {
        let method: MethodDescriptor<EntityCollectionData>;
        if (PageSize) {
          method = factory.portal_person_all_get({ ...navigationState, withProperties, PageSize, StartIndex: 0 });
        } else {
          method = factory.portal_person_all_get({ ...navigationState, withProperties });
        }
        return new MethodDefinition(method);
      },
    };
  }
}
