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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs = __importStar(require("fs"));
var toml = __importStar(require("toml"));
var process = __importStar(require("process"));
var axios_1 = __importDefault(require("axios"));
var RustMusl = /** @class */ (function () {
    function RustMusl(serverless, options) {
        this.target = "x86_64-unknown-linux-musl";
        this.defaultDependencies = [
            { name: "lambda_runtime", features: [] },
            { name: "tokio", features: ["full"] },
            { name: "openssl", features: ["vendored"] },
            { name: "serde_json", features: [] },
        ];
        this.defaultMain = "\nuse lambda_runtime::{handler_fn, Context};\nuse serde_json::Value;\n\ntype Error = Box<dyn std::error::Error + Sync + Send + 'static>;\n\n#[tokio::main]\nasync fn main() -> Result<(), Error> {\n    lambda_runtime::run(handler_fn(handler)).await?;\n    Ok(())\n}\n\nasync fn handler(event: Value, _: Context) -> Result<Value, Error> {\n    Ok(event)\n}";
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
    RustMusl.prototype.check = function () {
        if (this.serverless.service.provider.name != "aws")
            return false;
        if (this.serverless.service.provider.runtime != "provided")
            return false;
        return true;
    };
    RustMusl.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.check())
                            return [2 /*return*/];
                        child_process_1.spawnSync("cargo", ["init"]);
                        this.createCargoConfig();
                        return [4 /*yield*/, this.modifyCargo()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RustMusl.prototype.createCargoConfig = function () {
        if (!fs.existsSync(".cargo"))
            fs.mkdirSync(".cargo");
        var fd = fs.createWriteStream(".cargo/config");
        fd.write('[target.x86_64-unknown-linux-musl]\nlinker = "x86_64-linux-musl-gcc"');
    };
    RustMusl.prototype.modifyCargo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cargo, toml;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cargo = this.loadFunctionsToCargo();
                        return [4 /*yield*/, this.addDependencies(cargo)];
                    case 1:
                        cargo = _a.sent();
                        toml = this.createCargoToml(cargo);
                        fs.writeFileSync("Cargo.toml", toml);
                        return [2 /*return*/];
                }
            });
        });
    };
    RustMusl.prototype.addDependencies = function (cargo) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, dep, url, res, version;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.defaultDependencies;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        dep = _a[_i];
                        url = "https://crates.io/api/v1/crates/" + dep.name;
                        return [4 /*yield*/, axios_1.default.get(url)];
                    case 2:
                        res = _b.sent();
                        version = res.data.versions[0].num;
                        console.log("Add cargo dependency:", dep, version);
                        cargo.dependencies[dep.name] = dep.features.length
                            ? { version: version, features: dep.features }
                            : version;
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, cargo];
                }
            });
        });
    };
    RustMusl.prototype.loadFunctionsToCargo = function () {
        var cargo = toml.parse(fs.readFileSync("Cargo.toml").toString());
        cargo.bin = [];
        var isHandler = function (f) {
            return true;
        };
        for (var _i = 0, _a = this.serverless.service.getAllFunctions(); _i < _a.length; _i++) {
            var fname = _a[_i];
            var func = this.serverless.service.getFunction(fname);
            if (isHandler(func)) {
                var handlerName = func.handler.split(".")[1];
                cargo.bin.push({
                    name: handlerName,
                    path: "src/" + handlerName + ".rs",
                });
            }
        }
        return cargo;
    };
    RustMusl.prototype.makeInlineObject = function (obj) {
        var elements = [];
        for (var k in obj) {
            var v = JSON.stringify(obj[k]);
            elements.push(k + " = " + v);
        }
        var buf = "{ " + elements.join(", ") + " }";
        return buf;
    };
    RustMusl.prototype.createCargoToml = function (cargo) {
        var buf = "";
        buf += "[package]\n";
        for (var k in cargo.package) {
            buf += [k, "=", JSON.stringify(cargo.package[k]), "\n"].join(" ");
        }
        buf += "\n";
        for (var _i = 0, _a = cargo.bin; _i < _a.length; _i++) {
            var obj = _a[_i];
            buf += "[[bin]]\n";
            for (var k in obj) {
                buf += [k, "=", JSON.stringify(obj[k]), "\n"].join(" ");
            }
            buf += "\n";
            fs.writeFileSync(obj.path, this.defaultMain);
        }
        buf += "[dependencies]\n";
        for (var k in cargo.dependencies) {
            var v = typeof cargo.dependencies[k] == "object"
                ? this.makeInlineObject(cargo.dependencies[k])
                : "\"" + cargo.dependencies[k] + "\"";
            buf += [k, "=", v, "\n"].join(" ");
        }
        buf += "\n";
        return buf;
    };
    RustMusl.prototype.build = function () {
        if (!this.check())
            return;
        var env = process.env;
        env.TARGET_CC = "x86_64-linux-musl-gcc";
        var ret = child_process_1.spawnSync("cargo", ["build", "--target", this.target, "--release"], { env: env });
        console.log("status:", ret.status);
    };
    return RustMusl;
}());
module.exports = RustMusl;
