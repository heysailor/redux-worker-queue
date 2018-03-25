"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const middleware_1 = require("./middleware");
const WorkerQueue_1 = require("./WorkerQueue");
const duck_1 = __importDefault(require("./duck"));
// Store is only created just before first addOrUpdateItem action is dispatched.
// This means that if
function initStore(externalStore) {
    if (exports.store)
        return;
    // If reduxRootSelector is set and not using external store, it'll stuff things up.
    if (!externalStore && WorkerQueue_1.INSTANCE.rootSelector !== duck_1.defaultRootSelector) {
        throw new Error(`
      Do not use reduxRootSelector if not connecting to an external redux store. Doing so will likely cause queue to fail.
    `);
    }
    exports.store =
        externalStore || redux_1.createStore(duck_1.default, redux_1.applyMiddleware(middleware_1.middleware));
}
exports.initStore = initStore;
//# sourceMappingURL=store.js.map