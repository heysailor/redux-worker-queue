"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const middleware_1 = require("./middleware");
exports.workerQueueMiddleware = middleware_1.middleware;
const duck_1 = __importDefault(require("./duck"));
const WorkerQueue_1 = __importDefault(require("./WorkerQueue"));
exports.WorkerQueue = WorkerQueue_1.default;
let store = redux_1.createStore(duck_1.default);
exports.store = store;
function replaceStore(externalStore) {
    exports.store = store = externalStore;
}
exports.replaceStore = replaceStore;
//# sourceMappingURL=main.js.map