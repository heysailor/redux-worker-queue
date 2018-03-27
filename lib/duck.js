"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const queueDuck = __importStar(require("./queue/duck"));
const flagsDuck = __importStar(require("./flag/duck"));
var ActionTypes;
(function (ActionTypes) {
    ActionTypes["__CLEAR__"] = "__WORKER_QUEUE__CLEAR__";
})(ActionTypes = exports.ActionTypes || (exports.ActionTypes = {}));
// Actions
// Wipe queue  ## DANGER ZONE ##
exports.__clearQueue__ = () => {
    return { type: ActionTypes.__CLEAR__ };
};
const allReducers = redux_1.combineReducers({
    queue: queueDuck.default,
    flags: flagsDuck.default,
});
exports.default = allReducers;
//# sourceMappingURL=duck.js.map