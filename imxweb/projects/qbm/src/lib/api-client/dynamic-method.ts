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

import {
  ApiClient,
  DataModel,
  EntityCollectionData,
  EntityData,
  EntitySchema,
  EntityWriteData,
  ExtendedTypedEntityCollection,
  FilterData,
  FkCandidateBuilder,
  ITranslationProvider,
  MethodDefinition,
  MethodDescriptor,
  TimeZoneInfo,
  TypedEntity,
  TypedEntityBuilder,
} from '@imx-modules/imx-qbm-dbts';
import { imx_SessionService } from '../session/imx-session.service';

export class GenericTypedEntity extends TypedEntity {}

// eslint-disable-next-line max-classes-per-file
export class DynamicMethod {
  private builder: TypedEntityBuilder<TypedEntity>;

  private readonly getSchema: () => EntitySchema;

  /** Builds a generic typed entity using an API client and a method path. */
  constructor(
    /** Name of the schema i.e. `portal/targetsystem/adsgroup`*/
    private readonly schemaPath: string,
    /** URL of the method to call, i.e. `/portal/targetsystem/adsgroup`*/
    private readonly path: string,
    private readonly apiClient: ApiClient,
    session: imx_SessionService,
    translationProvider: ITranslationProvider,
  ) {
    const commitMethod = (entity, writeData) => this.apiClient.processRequest(this.do_put(writeData));

    this.getSchema = () => session.Client.getSchema(this.schemaPath);

    const fkProviderItems = new FkCandidateBuilder(this.getSchema()?.FkCandidateRoutes ?? [], this.apiClient).build();

    this.builder = new TypedEntityBuilder(GenericTypedEntity, fkProviderItems, commitMethod, translationProvider);
  }

  /**
   * Creates a new typed entity
   * @param initialData The data a new entity is initialized with
   * @returns typed entity, that contains initial data if defined
   */
  public createEntity(initialData?: EntityData): TypedEntity {
    return this.builder.buildReadWriteEntity({ entitySchema: this.getSchema(), entityData: initialData });
  }

  /**
   * Makes a request using the GET accessor
   * @param parametersOptional optional parameters
   * @returns the responded server data (ExtendedTypedEntityCollection<TypedEntity, unknown>)
   */
  public async Get(parametersOptional: any = {}): Promise<ExtendedTypedEntityCollection<TypedEntity, unknown>> {
    const data = await this.apiClient.processRequest(this.do_get(parametersOptional));
    return this.builder.buildReadWriteEntities(data, this.getSchema());
  }

  /**
   * Makes a request using the GET accessor
   * @param pathData The data, that is used to fill path parameter.
   * @param queryData The data, that is used to fill query parameter.
   * @param inputParameterName The data, that is used to fill body parameter.
   * @returns  the responded server data (ExtendedTypedEntityCollection<TypedEntity, unknown>)
   */
  public async Post(
    pathData: { [key: string]: string },
    queryData: { [key: string]: any },
    inputParameterName: any = {},
  ): Promise<ExtendedTypedEntityCollection<TypedEntity, unknown>> {
    const data = await this.apiClient.processRequest(this.do_post(pathData, queryData, inputParameterName));
    return this.builder.buildReadWriteEntities(data, this.getSchema());
  }

  /**
   * Get the data model used
   * @param options
   * @returns The data model for the path objects.
   */
  public async getDataModel(options: { filter?: FilterData[] } = {}): Promise<DataModel> {
    return this.apiClient.processRequest(this.do_getDataModel(options));
  }

  /**
   * Makes a request using the PUT accessor
   * @param entity the entity, that should be PUT to the server
   * @returns the responded server data (ExtendedTypedEntityCollection<TypedEntity, unknown>)
   */
  public async Put(entity: TypedEntity): Promise<ExtendedTypedEntityCollection<TypedEntity, unknown>> {
    const data = await this.apiClient.processRequest(this.do_put(entity.EntityWriteData));
    return this.builder.buildReadWriteEntities(data, this.getSchema());
  }

  private do_get(parametersOptional: any): MethodDescriptor<EntityCollectionData> {
    const parameters: any[] = [];
    for (var p in parametersOptional) {
      parameters.push({
        name: p,
        value: parametersOptional[p],
        in: 'query',
      });
    }

    return {
      path: this.path,
      parameters,
      method: 'GET',
      headers: {
        'imx-timezone': TimeZoneInfo.get(),
      },
      credentials: 'include',
      observe: 'response',
      responseType: 'json',
    };
  }

  private do_getDataModel(options: { filter?: FilterData[] } = {}): MethodDescriptor<DataModel> {
    return {
      path: this.path + '/datamodel',
      parameters: MethodDefinition.MakeQueryParameters(options, []),
      method: 'GET',
      headers: {
        'imx-timezone': TimeZoneInfo.get(),
      },
      credentials: 'include',
      observe: 'response',
      responseType: 'json',
    };
  }

  private do_put(inputParameterName: EntityWriteData): MethodDescriptor<EntityCollectionData> {
    return {
      path: this.path,
      parameters: [
        {
          name: 'inputParameterName',
          value: inputParameterName,
          in: 'body',
        },
      ],
      method: 'PUT',
      headers: {
        'imx-timezone': TimeZoneInfo.get(),
      },
      credentials: 'include',
      observe: 'response',
      responseType: 'json',
    };
  }

  private do_post(
    pathData: { [key: string]: string },
    queryData: { [key: string]: string },
    inputParameterName: any,
  ): MethodDescriptor<EntityCollectionData> {
    const parameters: any[] = [];
    for (var p of Object.keys(pathData)) {
      parameters.push({
        name: p,
        value: pathData[p],
        in: 'path',
      });
    }
    for (var p of Object.keys(queryData)) {
      parameters.push({
        name: p,
        value: queryData[p],
        in: 'query',
      });
    }
    parameters.push({
      name: 'inputParameterName',
      value: inputParameterName,
      required: true,
      in: 'body',
    });

    return {
      path: this.path,
      parameters,
      method: 'POST',
      headers: {
        'imx-timezone': TimeZoneInfo.get(),
      },
      credentials: 'include',
      observe: 'response',
      responseType: 'json',
    };
  }
}
