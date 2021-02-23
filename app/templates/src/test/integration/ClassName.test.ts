/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as path from "path";
import { TestUsers, TestUtility } from "@bentley/oidc-signin-tool";
import { BridgeJobDefArgs, BridgeRunner } from "@bentley/imodel-bridge";
import { ServerArgs } from "@bentley/imodel-bridge/lib/IModelHubUtils";
import { BridgeTestUtils, TestIModelInfo } from "../BridgeTestUtils";
import { BriefcaseDb, BriefcaseManager, IModelJsFs } from "@bentley/imodeljs-backend";
import { AccessToken, AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { BentleyStatus, ClientRequestContext, Logger, OpenMode } from "@bentley/bentleyjs-core";
import { KnownTestLocations } from "../KnownTestLocations";
import { HubUtility } from "../HubUtility";
import { loadConnectorConfig } from "../../ConnectorConfig";

describe("<%= className %> Connector Integration Test (Online)", () => {

  let testProjectId: string;
  let requestContext: AuthorizedClientRequestContext;
  let sampleIModel: TestIModelInfo;
  const fs = require("fs");
  const dotenv = require('dotenv').config();


  before(async () => {
    await BridgeTestUtils.startBackend();

    if (!IModelJsFs.existsSync(KnownTestLocations.outputDir))
      IModelJsFs.mkdirSync(KnownTestLocations.outputDir);

    try {
      requestContext = await TestUtility.getAuthorizedClientRequestContext(TestUsers.regular);
    } catch (error) {
      Logger.logError("Error", `Failed with error: ${error}`);
    }

    // const urlToDownload = await getDownloadableUrl(requestContext, "2", "d0ac841c-4e87-4d4e-a1f3-5b0f6ff426c4/d0ac841c-4e87-4d4e-a1f3-5b0f6ff426c4/86e213ba-8501-49c6-a0cd-7c0a0106c4d5", "d0ac841c-4e87-4d4e-a1f3-5b0f6ff426c4");
    // if (urlToDownload)
    //   await downloadFile(requestContext, urlToDownload, "C:\\bridge", "EDWImport.csv");

    // checking whether these properties exist in env file or not
    let testProjectName = "";
    if (process.env.imjs_test_project) {
      testProjectName = process.env.imjs_test_project;
    }

    let testIModelName = "";
    if (process.env.imjs_test_imodel) {
      testIModelName = process.env.imjs_test_imodel;
    }

    try {
      testProjectId = await HubUtility.queryProjectIdByName(requestContext, testProjectName);
      const targetIModelId = await HubUtility.createIModelWithBimFile(requestContext, testProjectId, testIModelName);
      expect(undefined !== targetIModelId);
      sampleIModel = await BridgeTestUtils.getTestModelInfo(requestContext, testProjectId, testIModelName);
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log(error);
    }
  });



  after(async () => {
    await BridgeTestUtils.shutdownBackend();
    IModelJsFs.purgeDirSync(KnownTestLocations.outputDir);
  });

  async function runBridge(bridgeJobDef: BridgeJobDefArgs, serverArgs: ServerArgs) {
    const runner = new BridgeRunner(bridgeJobDef, serverArgs);
    const status = await runner.synchronize();
    expect(status === BentleyStatus.SUCCESS);
    const briefcases = BriefcaseManager.getCachedBriefcases();
    const briefcaseEntry = BriefcaseManager.isValidBriefcaseId(briefcases[0].briefcaseId);
    expect(briefcaseEntry === true);
    let imodel: BriefcaseDb;
    imodel = await BriefcaseDb.open(requestContext, { fileName: briefcases[0].fileName, readonly: false });
    // BridgeTestUtils.verifyIModel(imodel, bridgeJobDef, isUpdate);
    expect(imodel.openMode == OpenMode.ReadWrite);
    imodel.close();
  }

  it("should download and perform updates", async () => {
    const bridgeJobDef = new BridgeJobDefArgs();
    const sourcePath = path.join(__dirname, "../../assets/" + process.env.imjs_test_import_source);
    const targetPath = "";
    bridgeJobDef.sourcePath = sourcePath;
    // bridgeJobDef.bridgeModule = "../../test/integration/TestiModelBridge.js";
    bridgeJobDef.bridgeModule = path.join(__dirname, "../../<%= className %>.js");
    const serverArgs = new ServerArgs();  // TODO have an iModelBank version of this test
    serverArgs.contextId = testProjectId;
    serverArgs.iModelId = sampleIModel.id;
    bridgeJobDef.updateDbProfile = false;
    bridgeJobDef.updateDomainSchemas = false;
    bridgeJobDef.documentGuid = process.env.FederationGuid;
    serverArgs.getToken = async (): Promise<AccessToken> => {
      return requestContext.accessToken;
    };

    await runBridge(bridgeJobDef, serverArgs);
  });
});
