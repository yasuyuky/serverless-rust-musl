import Serverless from "serverless";
import Plugin from "serverless/classes/Plugin";
import { spawnSync } from "child_process";

class RustMusl implements Plugin {
  serverless: Serverless;
  options: Serverless.Options;
  hooks: Plugin.Hooks;
  commands: Plugin.Commands;

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      cargoinit: {
        lifecycleEvents: ["init"],
      },
    };

    this.hooks = {
      "cargoinit:init": this.init.bind(this),
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
}

module.exports = RustMusl;
