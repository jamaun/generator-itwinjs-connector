/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
import { loadConfig, optional, required } from "@bentley/env-config-loader";

export function loadConnectorConfig() {
  return loadConfig({
    DEPLOYMENT_ENV: required,
    CLIENT_ID: required,
    CLIENT_SECRET: required,
    BRIEFCASE_CACHE_DIR: required,
    GPRID: required,
    Application_Version: required,
    Bridge_Name: required,
  });
}

export type ConnectorConfig = ReturnType<typeof loadConnectorConfig>;
