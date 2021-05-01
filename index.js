"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var RustMusl = /** @class */ (function () {
    function RustMusl(serverless, options) {
        this.defaultDependencies = [
            ["lambda_runtime", []],
            ["tokio", ["full"]],
            ["openssl", ["vendored"]],
        ];
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
            console.log(dep);
            var args = ["add", dep[0]].concat(dep[1].length ? ["--features"].concat(dep[1]) : []);
            child_process_1.spawnSync("cargo", args);
        }
    };
    return RustMusl;
}());
module.exports = RustMusl;
