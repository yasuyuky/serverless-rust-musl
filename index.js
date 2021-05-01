"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var RustMusl = /** @class */ (function () {
    function RustMusl(serverless, options) {
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
    return RustMusl;
}());
module.exports = RustMusl;
