/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { BridgeJobDefArgs, IModelBridge } from "@bentley/imodel-bridge";
import { assert, ClientRequestContext, Id64String, IModelStatus, Logger } from "@bentley/bentleyjs-core";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import {
  FunctionalModel, FunctionalPartition, GroupInformationPartition, IModelDb, IModelJsFs, RepositoryLink, SubjectOwnsPartitionElements,
} from "@bentley/imodeljs-backend";
import { Code, CodeScopeSpec, CodeSpec, IModel, IModelError, InformationPartitionElementProps, ModelProps } from "@bentley/imodeljs-common";
import { ChangeResults, ItemState, SourceItem, SynchronizationResults } from "@bentley/imodel-bridge/lib/Synchronizer";
import { Guid, ImodelHelper } from '@bentley/ps-connectors-common';
import { loadConnectorConfig } from "./ConnectorConfig";
import * as hash from "object-hash";
import * as fs from "fs";
import * as path from "path";


export class <%= className %> extends IModelBridge {
  private _data: any;
  private _sourceDataState: ItemState = ItemState.New;
  private _sourceData ?: string;
  private _repositoryLink ?: RepositoryLink;
  private readonly _config = loadConnectorConfig();


  private readonly _modelName = "Functional_Tag";
  private _federationGuid: string = "";
  private _isJobInitialized: boolean = false;

  public  readonly TestBridge_CODE_SPEC = "<%= className %>CodeSpecs";
  public  readonly LOG_CATEGORY: string = "<%= className %>.Connector";
  public initialize(_params: BridgeJobDefArgs) {
    // nothing to do here
  }

  public async importDomainSchema(_requestContext: AuthorizedClientRequestContext | ClientRequestContext): Promise < any > {
    if(this._sourceDataState === ItemState.Unchanged) {
    return;
  }
    //here you will add logic to import scehma example is written below
    //await this.synchronizer.imodel.importSchemas(_requestContext, ["Schema file path to be imported"]);
}

  public async importDynamicSchema(requestContext: AuthorizedClientRequestContext | ClientRequestContext): Promise < any > {
  if(null === requestContext)
return;
  }

  public async initializeJob(): Promise < void> {
  if(this._isJobInitialized) {
  return;
}
try {
  const existingId = ImodelHelper.QueryFunctionalModel(this.synchronizer.imodel, this.jobSubject.id, this._modelName);
  if (!existingId) {
    const modelId = await ImodelHelper.CreateFunctionalModel(this.synchronizer.imodel, this.jobSubject.id, this._modelName, this._federationGuid);
    // relate this model to the source data
    // code todo
  } else {
    // ensure functional model has federationGuid
    const parElement = this.synchronizer.imodel.elements.getElement(existingId);
    if (!parElement.federationGuid && this._federationGuid) {
      parElement.federationGuid = this._federationGuid;
      parElement.update();
    }
  }

  this._isJobInitialized = true;
  Logger.logInfo(this.LOG_CATEGORY, "Job initialized successfully.");
} catch (error) {
  const errorMessage = JSON.stringify(error);
  Logger.logError(this.LOG_CATEGORY, `Job initialization failed with: ${errorMessage}`);
  throw error;
}
  }

  public async openSourceData(sourcePath: string): Promise < void> {
  // ignore the passed in source and open the test file
  const json = fs.readFileSync(sourcePath, "utf8");
  this._data = JSON.stringify(json);
  this._sourceData = sourcePath;

  const documentStatus = this.getDocumentStatus(); // make sure the repository link is created now, while we are in the repository channel
  this._sourceDataState = documentStatus.itemState;
  this._repositoryLink = documentStatus.element;
}



  // importDefinitions is for definitions that are written to shared models such as DictionaryModel
  public async importDefinitions(): Promise < any > {
  if(this._sourceDataState === ItemState.Unchanged) {
  return;
}
this.insertCodeSpecs();
  }

  public async updateExistingData() {
  const groupModelId = ImodelHelper.QueryFunctionalModel(this.synchronizer.imodel, this.jobSubject.id, this._modelName);
  if (undefined === groupModelId) {
    const error = `Unable to find model Id for ${undefined === groupModelId}`;
    throw new IModelError(IModelStatus.BadArg, error, Logger.logError);
  }

  if (this._sourceDataState === ItemState.Unchanged) {
    return;
  }

  if (this._sourceDataState === ItemState.New) {

  }

  this.convertGroupElements(groupModelId);

}

  public getApplicationId(): string {
  return this._config.GPRID;
}
  public getApplicationVersion(): string {
  return this._config.Application_Version;
}
  public getBridgeName(): string {
  return this._config.Bridge_Name;
}

  public getJobSubjectName(sourcePath: string): string {
  const sourcefileName = path.parse(sourcePath).base;
  const subjectName = this.getBridgeName() + ":" + path.parse(sourcefileName).name;
  // Generate Federation Guid of Functional Model from Concatenation of Subject and ModelName strings
  this._federationGuid = Guid.StringToGuid(subjectName + this._modelName);
  Logger.logInfo(this.LOG_CATEGORY, `Bridge: Federation Guid generated for ${subjectName} as ${this._federationGuid} `);
  return subjectName;
}

  private stringToGuid(anyString: string): any {
  var crypto = require("crypto");
  const hexToUuid = require('hex-to-uuid');
  var md5 = crypto.createHash("md5");
  var hexstring = md5.update(Buffer.from(anyString, 'utf-8')).digest('hex');
  return hexToUuid(hexstring);
}

  private get repositoryLink(): RepositoryLink {
  assert(this._repositoryLink !== undefined);
  return this._repositoryLink!;
}

  private getDocumentStatus(): SynchronizationResults {
  let timeStamp = Date.now();
  assert(this._sourceData !== undefined, "we should not be in this method if the source file has not yet been opened");
  const stat = IModelJsFs.lstatSync(this._sourceData); // will throw if this._sourceData names a file that does not exist. That would be a bug. Let it abort the job.
  if (undefined !== stat) {
    timeStamp = stat.mtimeMs;
  }

  const sourceItem: SourceItem = {
    id: this._sourceData,
    version: timeStamp.toString(),
  };
  const documentStatus = this.synchronizer.recordDocument(IModelDb.rootSubjectId, sourceItem);
  if (undefined === documentStatus) {
    const error = `Failed to retrieve a RepositoryLink for ${this._sourceData}`;
    throw new IModelError(IModelStatus.BadArg, error, Logger.logError);
  }
  return documentStatus;
}


  private queryGroupModel(): Id64String | undefined {
  return this.synchronizer.imodel.elements.queryElementIdByCode(GroupInformationPartition.createCode(this.synchronizer.imodel, this.jobSubject.id, ModelNames.Group));

}


  private convertGroupElements(_groupModelId: Id64String) {
    // add code here for data parsing
    /*
    for (const group of this._data.Groups) {
      const str = JSON.stringify(group);
      const sourceItem: SourceItem = {
        id: group.guid,
        checksum: hash.MD5(str),
      };
      const results = this.synchronizer.detectChanges(groupModelId, "Group", sourceItem);
      if (results.state === ItemState.Unchanged) {
        this.synchronizer.onElementSeen(results.id!);
        continue;
      }
      if (group.name === undefined) {
        throw new IModelError(IModelStatus.BadArg, "Name undefined for TestBridge group", Logger.logError);
      }


      this.synchronizer.updateIModel(sync, groupModelId, sourceItem, "Group");
      // Update IModel after any change
    }
     */
  }

  private insertCodeSpecs() {
  let hasCodeSpec;
  try {
    hasCodeSpec = this.synchronizer.imodel.codeSpecs.hasName(this.TestBridge_CODE_SPEC);

    if (hasCodeSpec) {
      return;
    }
    const spec = CodeSpec.create(this.synchronizer.imodel, this.TestBridge_CODE_SPEC, CodeScopeSpec.Type.Model);
    this.synchronizer.imodel.codeSpecs.insert(spec);

  } catch (error) {
    // tslint:disable-next-line: no-console
    console.log(error);
    const errorMessage = JSON.stringify(error);
    Logger.logError(this.LOG_CATEGORY, `Unable to create CodeSpec due to error:  ${errorMessage}`);
  }
}




}

export function getBridgeInstance() {
  return new <%= className %> ();
}

export enum ModelNames {
  Physical = "<%= className %>_Physical",
  Definition = "<%= className %>_Definitions",
  Group = "<%= className %>_Groups",
}
