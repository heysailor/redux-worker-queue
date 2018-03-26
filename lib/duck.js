"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const duck_1 = __importDefault(require("./queue/duck"));
const duck_2 = __importDefault(require("./flag/duck"));
var ActionTypes;
(function (ActionTypes) {
    ActionTypes["__CLEAR__"] = "__WORKER_QUEUE__CLEAR__";
    ActionTypes["CLEAN"] = "__WORKER_QUEUE__CLEAN";
})(ActionTypes = exports.ActionTypes || (exports.ActionTypes = {}));
// Actions
// Wipe queue  ## DANGER ZONE ##
exports.__clearQueue__ = () => {
    return { type: ActionTypes.__CLEAR__ };
};
exports.clean = () => {
    return {
        type: ActionTypes.CLEAN,
    };
};
const allReducers = redux_1.combineReducers({
    queue: duck_1.default,
    flag: duck_2.default,
});
exports.default = allReducers;
//# sourceMappingURL=duck.js.map