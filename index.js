"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs = __importStar(require("fs"));
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
        if (!fs.existsSync(".cargo"))
            fs.mkdirSync(".cargo");
        var fd = fs.createWriteStream(".cargo/config");
        fd.write('[target.x86_64-unknown-linux-musl]\nlinker = "x86_64-linux-musl-gcc"');
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
