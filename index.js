"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var RustMusl = /** @class */ (function () {
    function RustMusl(serverless, options) {
        this.defaultDependencies = [
            { name: "lambda_runtime", features: [] },
            { name: "tokio", features: ["full"] },
            { name: "openssl", features: ["vendored"] },
        ];
        this.serverless = serverless;
        this.options = options;
        this.commands = {
            cargoinit: {
                lifecycleEvents: ["init", "addDependencies"],
            },
            build: { lifecycleEvents: ["build"] },
        };
        this.hooks = {
            "cargoinit:init": this.init.bind(this),
            "cargoinit:addDependencies": this.addDependencies.bind(this),
            "build:build": this.build.bind(this),
        };
    }
    RustMusl.prototype.check = function () {
        if (this.serverless.service.provider.name != "aws")
            return false;
        if (this.serverless.service.provider.runtime != "provided")
            return false;
        return true;
    };
    RustMusl.prototype.init = function () {
        if (!this.check())
            return;
        child_process_1.spawnSync("cargo", ["init"]);
    };
    RustMusl.prototype.addDependencies = function () {
        for (var _i = 0, _a = this.defaultDependencies; _i < _a.length; _i++) {
            var dep = _a[_i];
            console.log("Add cargo dependency:", dep);
            var args = ["add", dep.name].concat(dep.features.length ? ["--features"].concat(dep.features) : []);
            child_process_1.spawnSync("cargo", args);
        }
    };
    RustMusl.prototype.build = function () {
        if (!this.check())
            return;
        child_process_1.spawnSync("cargo", ["build", "--target", "x86_64-unknown-linux-musl"]);
    };
    return RustMusl;
}());
module.exports = RustMusl;
