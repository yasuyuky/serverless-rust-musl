import Serverless from "serverless";
import Plugin from "serverless/classes/Plugin";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as toml from "toml";

class RustMusl implements Plugin {
  serverless: Serverless;
  options: Serverless.Options;
  hooks: Plugin.Hooks;
  commands: Plugin.Commands;

  defaultDependencies: { name: string; features: string[] }[] = [
    { name: "lambda_runtime", features: [] },
    { name: "tokio", features: ["full"] },
    { name: "openssl", features: ["vendored"] },
  ];

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      cargoinit: {
        lifecycleEvents: ["init", "addDependencies"],
      },
      build: {
        lifecycleEvents: ["build"],
      },
    };

    this.hooks = {
      "cargoinit:init": this.init.bind(this),
      "cargoinit:addDependencies": this.addDependencies.bind(this),
      "build:build": this.build.bind(this),
    };
  }

  check() {
    if (this.serverless.service.provider.name != "aws") return false;
    if (this.serverless.service.provider.runtime != "provided") return false;
    return true;
  }

  init() {
    if (!this.check()) return;
    spawnSync("cargo", ["init"]);
    if (!fs.existsSync(".cargo")) fs.mkdirSync(".cargo");
    let fd = fs.createWriteStream(".cargo/config");
    fd.write(
      '[target.x86_64-unknown-linux-musl]\nlinker = "x86_64-linux-musl-gcc"'
    );
  }

  addDependencies() {
    for (let dep of this.defaultDependencies) {
      console.log("Add cargo dependency:", dep);
      let args = ["add", dep.name].concat(
        dep.features.length ? ["--features"].concat(dep.features) : []
      );
      spawnSync("cargo", args);
    }
  }

  loadFunctionsToCargo() {
    let cargo = toml.parse(fs.readFileSync("Cargo.toml").toString());
    cargo.bin = [];
    const isHandler = (f: any): f is Serverless.FunctionDefinitionHandler => {
      return true;
    };
    for (let fname of this.serverless.service.getAllFunctions()) {
      let func = this.serverless.service.getFunction(fname);
      if (isHandler(func)) {
        let handlerName = func.handler.split(".")[1];
        cargo.bin.push({
          name: handlerName,
          src: `src/${handlerName}.rs`,
        });
      }
    }
    return cargo;
  }

  build() {
    if (!this.check()) return;
    spawnSync("cargo", ["build", "--target", "x86_64-unknown-linux-musl"]);
  }
}

module.exports = RustMusl;
