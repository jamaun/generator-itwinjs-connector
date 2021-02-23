/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const path = require("path");
const glob = require("glob");
const semver = require("semver");
const latestVersion = require("latest-version");
const { pascalCase } = require("pascal-case");
const { paramCase } = require("param-case");

const logo = `
${chalk.blue("               ,╖║▒▒║  ")}${chalk.cyan(" ┌╗╖        ")}
${chalk.blue("            .╓║▒╝╙     ")}${chalk.cyan(" ,╓,  ,╓╖╖, ")}
${chalk.blue("         ╓@▒║╜         ")}${chalk.cyan(" ]▒[ ║▒║ ╙╙*")}
${chalk.blue("      ╖║║╜`       ╓║║╖ ")}${chalk.cyan(" ]▒[  ╙╜╝║║╗")}
${chalk.blue("     ║▒`          ║▒▒║ ")}${chalk.cyan(" ]▒[ ╙▒║╖║▒╜")}
${chalk.blue("     ▒▒         ╓      ")}${chalk.cyan("╖║▒┘        ")}
${chalk.blue("     ▒▒         ▒▒║╥,            ▒▒")}
${chalk.blue("     ▒▒         ╙╝▒▒▒▒           ▒▒")}
${chalk.blue("     ▒▒           ║▒▒▒           ▒▒")}
${chalk.blue("     ▒▒           ║▒▒▒           ▒▒")}
${chalk.blue("     ▒▒      ┌╖,  ║▒▒▒  ,╖┐      ▒▒")}
${chalk.blue("     ╙▒║╖    ]▒▒▒║║▒▒▒║▒▒▒[    ╓║▒╜")}
${chalk.blue("        ╙║║╗╖  ╙║▒▒▒▒▒▒║╜` ╓╥║║╜`  ")}
${chalk.blue("           `╙║║╖, `╙╜` ,╖║▒╜`      ")}
${chalk.blue("               \"╜▒║╖╖║▒╝╙          ")}
${chalk.blue("                   ``              ")}`;

const getNameUsage = (answers) => `${chalk.grey("  OK! We'll use this for the following values in your project:")}
    ${chalk.grey("⁃ Module Name:")} ${chalk.green(pascalCase(answers.name) + ".ts")}
    ${chalk.grey("⁃ Package Name:")} ${chalk.green("@bentley/" + answers.name)}
    ${chalk.grey("⁃ Logging Category:")} ${chalk.green(answers.name)}
`;

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    try {
      this.argument("directory", { type: String, required: true });
    } catch (error) {
      console.error("Please specify the project directory:");
      console.error(`  ${chalk.cyan("npm init imodeljs-Connector")} ${chalk.green("<project-directory>")}`);
      console.error("\nFor example:");
      console.error(`  ${chalk.cyan("npx yo imodeljs-Connector")} ${chalk.green("my-connector")}`);
      process.exit(1);
    }
  }

  async initializing() {
    this.destinationRoot(path.resolve(this.contextRoot, this.options.directory));

    this._defaultNodeVersion = semver.satisfies(process.versions.node, "12.x") ? process.versions.node : "12.18.4";
    this._latestIMJSVersion = await latestVersion("@bentley/imodeljs-common");
    if (this.options.imjsversion !== undefined &&
      !semver.satisfies(this.options.imjsversion, '2.x', { includePrerelease: true }) &&
      this.options.imjsversion !== "latest") {
      throw "imjsversion semver is not valid. Connector generator supports only 2.x. version of imjs packages";
    }

    if (this.options.nodeversion === "default") {
      this.options.nodeversion = this._defaultNodeVersion;
    }

    if (this.options.imjsversion === "latest") {
      this.options.imjsversion = this._latestIMJSVersion;
    }
  }

  async prompting() {
    this.log(logo);
    this.log(chalk.bold(`Welcome to the ${chalk.cyan("iModel.js Connecter")} generator!\n`));

    const logDuringPrompts = (messageOrCallback) => {
      return {
        when: (answers) => {
          const message = (typeof (messageOrCallback) === "string") ? messageOrCallback : messageOrCallback(answers)
          this.log(message);
          return false;
        },
      }
    }

    this.answers = await this.prompt([
      {
        name: "gprId",
        type: "input",
        message: "What\'s your product GPRID?",
        when: () => !this.options.gprId,
        validate: (input) => (input.trim() !== "" && Number.isInteger(Number(input))) ? true : "Please enter a valid GPRID number",
      },
      {
        name: "name",
        message: "What\'s the name of your Connector? (Use a unique, descriptive name.",
        default: paramCase(path.basename(this.destinationRoot())),
        when: () => !this.options.name,
        filter: (v) => paramCase(v),
        transformer: (v) => chalk.cyan(paramCase(v)),
      },
      this.options.name ? { when: () => false } : logDuringPrompts(getNameUsage),

      {
        name: "imjsversion",
        message: "What version of iModel.js would you like to use? (Currently only 2.x versions supported)",
        default: "2.11.0",
        when: () => !this.options.imjsversion,
        validate: (input) => (semver.satisfies(input, "2.x", { includePrerelease: true })) ? true : "Please enter a valid semver range",
      },
      {
        name: "nodeversion",
        message: `What version of Node would you like to use? (Currently only 12.x versions supported)`,
        default: this._defaultNodeVersion,
        when: () => !this.options.nodeversion,
        validate: (input) => (semver.satisfies(input, "12.x")) ? true : "Please enter a valid node version.",
      },
      {
        name: "ApplicationVersion",
        message: "What\'s your Application Version?",
        default: "1.0.0.0",
        when: () => !this.options.ApplicationVersion,
      },
      {
        name: "clientId",
        message: "What\'s your (QA) OIDC Client Id?",
        default: "imodeljs-spa-test",
        when: () => !this.options.clientId,
      },
      {
        name: "clientScope",
        message: "Enter Client scopes you want to define?",
        default: "openid email profile organization imodelhub context-registry-service:read-only imodeljs-router reality-data:read reality-data:write product-settings-service projectwise-share urlps-third-party rbac-service",
        when: () => !this.options.clientScope,
      },
      {
        name: "testproject",
        message: "What\'s your Test Project Name?",
        default: "ConnectorProject",
        when: () => !this.options.testproject,
      },
      {
        name: "testImodel",
        message: "What\'s your Test Imodel Name?",
        default: "ConnectoriModel",
        when: () => !this.options.testImodel,
      },
      {
        name: "test_user",
        message: "What\'s your Test User?",
        default: "test.agserviceflow.bentley@plantsight.com",
        when: () => !this.options.test_user,
      },
      {
        name: "test_password",
        type: "password",
        message: "What\'s your Test User Password?",
        mask: '*',
        default: "user@12345",
        when: () => !this.options.test_password,
      },
      {
        name: "testseed",
        message: "What\'s your Seed File name",
        default: "ConnectorSeed.bim",
        when: () => !this.options.testseed,
      },
      {
        name: "testImport",
        message: "What\'s your Import File name?",
        default: "Import.ext",
        when: () => !this.options.testImport,
      },
    ]);
  }

  async writing() {
    this.log("\nGenerating your Connector...");
    let files = glob.sync("**/*", { cwd: this.sourceRoot(), nodir: true, dot: true });

    this.log(files);
    const answerName = this.answers.name || this.options.name;
    const templateData = {
      name: answerName,
      capsName: answerName.replace(/-/g, " ").toUpperCase(),
      className: pascalCase(answerName),
      gprId: this.answers.gprId || this.options.gprId,
      clientId: this.answers.clientId || this.options.clientId || "",
      clientScope: this.answers.clientScope || this.options.clientScope,
      ModelName: this.answers.ModelName || this.options.ModelName,
      CODESPEC: this.answers.CODESPEC || this.options.CODESPEC,
      LOGCategory: this.answers.LOGCategory || this.options.LOGCategory,
      ApplicationVersion: this.answers.ApplicationVersion || this.options.ApplicationVersion,
      imjsversion: this.answers.imjsversion || this.options.imjsversion || this._latestIMJSVersion,
      nodeversion: this.answers.nodeversion || this.options.nodeversion || process.versions.node,
      testproject: this.answers.testproject || this.options.testproject,
      testImodel: this.answers.testImodel || this.options.testImodel,
      test_user: this.answers.test_user || this.options.test_user,
      test_password: this.answers.test_password || this.options.test_password,
      testImport: this.answers.testImport || this.options.testImport,
      testseed: this.answers.testseed || this.options.testseed,
    };

    files.forEach((file) => {
      let destPath = this.destinationPath(file);
      const srcPath = this.templatePath(file);

      if (destPath.match(/.*ClassName(\.test)?\.ts$/))
        destPath = replaceFileName(destPath, "ClassName", templateData.className);
      else if (destPath.match(/.*gitignore$/))
        destPath = replaceFileName(destPath, "gitignore", ".gitignore");

      this.fs.copyTpl(srcPath, destPath, templateData);
      return;
    }, this);
  }

  install() {
    this.installDependencies({
      npm: true,
      bower: false,
      yarn: false,
    });
  }

  end() {
    this.log(chalk.bold.green(`Finished!`));
  }
};

function replaceFileName(fullpath, searchValue, replaceValue) {
  return path.join(path.dirname(fullpath), path.basename(fullpath).replace(searchValue, replaceValue));
}

function paramCaseWithSlash(input) {
  return paramCase(input, { stripRegexp: /[^A-Z0-9/]+/gi });
}
