"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const redux_saga_1 = __importDefault(require("redux-saga"));
const middleware_1 = require("./middleware");
exports.workerQueueMiddleware = middleware_1.middleware;
const duck_1 = __importDefault(require("./duck"));
const WorkerQueue_1 = __importDefault(require("./WorkerQueue"));
exports.WorkerQueue = WorkerQueue_1.default;
// Redux Saga
const sagaMiddleware = redux_saga_1.default();
// Create store
let store = redux_1.createStore(duck_1.default, redux_1.applyMiddleware(sagaMiddleware));
exports.store = store;
let storeReplaced = false;
// Allow replacement of store, once, eg on middleware use.
function replaceStore(externalStore) {
    exports.store = store = externalStore;
    storeReplaced = true;
}
exports.replaceStore = replaceStore;
// Activate sagas.
sagaMiddleware.run(duck_1.rootSagas);
//# sourceMappingURL=main.js.map