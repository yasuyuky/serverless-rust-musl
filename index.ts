import Serverless from "serverless";
import Plugin from "serverless/classes/Plugin";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as toml from "toml";
import * as process from "process";
import axios from "axios";

class RustMusl implements Plugin {
  serverless: Serverless;
  options: Serverless.Options;
  hooks: Plugin.Hooks;
  commands: Plugin.Commands;
  target: string = "x86_64-unknown-linux-musl";

  defaultDependencies: { name: string; features: string[] }[] = [
    { name: "lambda_runtime", features: [] },
    { name: "tokio", features: ["full"] },
    { name: "openssl", features: ["vendored"] },
    { name: "serde_json", features: [] },
  ];

  defaultMain: string = `
use lambda_runtime::{handler_fn, Context};
use serde_json::Value;

type Error = Box<dyn std::error::Error + Sync + Send + 'static>;

#[tokio::main]
async fn main() -> Result<(), Error> {
    lambda_runtime::run(handler_fn(handler)).await?;
    Ok(())
}

async fn handler(event: Value, _: Context) -> Result<Value, Error> {
    Ok(event)
}`;

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      cargoinit: {
        lifecycleEvents: ["init"],
      },
      build: {
        lifecycleEvents: ["build"],
      },
    };

    this.hooks = {
      "cargoinit:init": this.init.bind(this),
      "build:build": this.build.bind(this),
    };
  }

  check() {
    if (this.serverless.service.provider.name != "aws") return false;
    if (this.serverless.service.provider.runtime != "provided") return false;
    return true;
  }

  async init() {
    if (!this.check()) return;
    spawnSync("cargo", ["init"]);
    this.createCargoConfig();
    await this.modifyCargo();
  }

  createCargoConfig() {
    if (!fs.existsSync(".cargo")) fs.mkdirSync(".cargo");
    let fd = fs.createWriteStream(".cargo/config");
    fd.write(
      '[target.x86_64-unknown-linux-musl]\nlinker = "x86_64-linux-musl-gcc"'
    );
  }

  async modifyCargo() {
    let cargo = toml.parse(fs.readFileSync("Cargo.toml").toString());
    cargo = this.loadFunctions(cargo);
    cargo = await this.addDependencies(cargo);
    let cargotoml = this.createCargoToml(cargo);
    fs.writeFileSync("Cargo.toml", cargotoml);
  }

  async addDependencies(cargo: any) {
    for (let dep of this.defaultDependencies) {
      let url = `https://crates.io/api/v1/crates/${dep.name}`;
      let res = await axios.get(url);
      let version = res.data.versions[0].num;
      console.log("Add cargo dependency:", dep, version);
      cargo.dependencies[dep.name] = dep.features.length
        ? { version, features: dep.features }
        : version;
    }
    return cargo;
  }

  loadFunctions(cargo: any) {
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
          path: `src/${handlerName}.rs`,
        });
      }
    }
    return cargo;
  }

  makeInlineObject(obj: any) {
    let elements = [];
    for (let k in obj) {
      let v = JSON.stringify(obj[k]);
      elements.push(`${k} = ${v}`);
    }
    let buf = `{ ${elements.join(", ")} }`;
    return buf;
  }

  createCargoToml(cargo: any) {
    let buf = "";
    buf += `[package]\n`;
    for (let k in cargo.package) {
      buf += [k, "=", JSON.stringify(cargo.package[k]), "\n"].join(" ");
    }
    buf += "\n";

    for (let obj of cargo.bin) {
      buf += `[[bin]]\n`;
      for (let k in obj) {
        buf += [k, "=", JSON.stringify(obj[k]), "\n"].join(" ");
      }
      buf += "\n";
      fs.writeFileSync(obj.path, this.defaultMain);
    }

    buf += `[dependencies]\n`;
    for (let k in cargo.dependencies) {
      let v =
        typeof cargo.dependencies[k] == "object"
          ? this.makeInlineObject(cargo.dependencies[k])
          : `"${cargo.dependencies[k]}"`;
      buf += [k, "=", v, "\n"].join(" ");
    }
    buf += "\n";
    return buf;
  }

  build() {
    if (!this.check()) return;
    let env = process.env;
    env.TARGET_CC = "x86_64-linux-musl-gcc";
    let ret = spawnSync(
      "cargo",
      ["build", "--target", this.target, "--release"],
      { env }
    );
    console.log("status:", ret.status);
  }
}

module.exports = RustMusl;
