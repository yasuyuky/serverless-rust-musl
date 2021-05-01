import Serverless from "serverless";
import Plugin from "serverless/classes/Plugin";
import { spawnSync } from "child_process";

class RustMusl implements Plugin {
  serverless: Serverless;
  options: Serverless.Options;
  hooks: Plugin.Hooks;
  commands: Plugin.Commands;

  defaultDependencies: [string, string[]][] = [
    ["lambda_runtime", []],
    ["tokio", ["full"]],
    ["openssl", ["vendored"]],
  ];

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      cargoinit: {
        lifecycleEvents: ["init", "addDependencies"],
      },
    };

    this.hooks = {
      "cargoinit:init": this.init.bind(this),
      "cargoinit:addDependencies": this.addDependencies.bind(this),
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
  }

  addDependencies() {
    for (let dep of this.defaultDependencies) {
      console.log(dep);
      let args = ["add", dep[0]].concat(
        dep[1].length ? ["--features"].concat(dep[1]) : []
      );
      spawnSync("cargo", args);
    }
  }
}

module.exports = RustMusl;
