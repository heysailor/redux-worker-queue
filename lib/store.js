"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const middleware_1 = require("./middleware");
const duck_1 = __importDefault(require("./duck"));
// Store is only created just before first addOrUpdateItem action is dispatched.
// This means that if
function initStore(externalStore) {
    if (exports.store)
        return;
    exports.store =
        externalStore || redux_1.createStore(duck_1.default, redux_1.applyMiddleware(middleware_1.middleware));
}
exports.initStore = initStore;
// wrapped in function, as INSTANCE not around before WokerQueue.init() called
exports.rootSelector = (state, workerQueueInstance) => workerQueueInstance.rootSelector(state);
//# sourceMappingURL=store.js.map