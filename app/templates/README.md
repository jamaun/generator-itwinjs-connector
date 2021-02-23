# @bentley/<%= name %>

Copyright © Bentley Systems, Inc. 2020

## About this Repository

This repository contains source for @bentley/<%= name %>'s backend.

## Prerequisites

- [Git](https://git-scm.com/)
- [Node](https://nodejs.org/en/): an installation of the latest security patch of Node <%= nodeversion %>. The Node installation also includes the **npm** package manager.
- [Visual Studio Code](https://code.visualstudio.com/): an optional dependency, but the repository structure is optimized for its use.

## Build Instructions

1. Clone repository (first time) with `git clone` or pull updates to the repository (subsequent times) with `git pull`. It is possible this repo was generated with yeoman.
2. Install dependencies: `npm install`
3. Clean: `npm run clean`
4. Build source: `npm run build`

If you haven't setup your Bentley NPM Registry, see [Authentication](#Authentication).

## Running @bentley/<%= name %>

Running locally (local backend):

1. `npm run start`

That will start the backend server, the dev-cors-proxy-server, and the webserver on your local computer. Open a browser and navigate to localhost:3000

## Authentication

Configure npm and log in to the Bentley npm registry with the following commands:

```cmd
npm config set @bentley:registry https://pkgs.dev.azure.com/bentleycs/_packaging/Packages/npm/registry/
```

# Building and publishing

The created project will be setup to build Linux based Kubernetes backend artifacts.

## K8s

Visit the [Deployment Guide](https://dev.azure.com/bentleycs/iModelTechnologies/_wiki/wikis/Backend%20and%20Agent%20Deployment/9164/iModel.js-Agent-and-Backend-Deployment-Guide) to get started on deploying the backend.

## Other Documentation

@bentley/<%= name %> depends heavily on iModel.js library. For more information about that library, see [imodeljs.org]
