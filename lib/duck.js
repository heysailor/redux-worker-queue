"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const duck_1 = __importDefault(require("./queue/duck"));
const base = redux_1.combineReducers({
    queue: duck_1.default,
});
const rootReducer = redux_1.combineReducers({
    workerQueue: base,
});
exports.default = rootReducer;
//# sourceMappingURL=duck.js.map