"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const duck_1 = __importDefault(require("./queue/duck"));
const workerQueue = redux_1.combineReducers({
    queue: duck_1.default,
});
exports.default = workerQueue;
//# sourceMappingURL=duck.js.map