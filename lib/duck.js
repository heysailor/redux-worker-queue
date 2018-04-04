"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const flagDuck = __importStar(require("./flag/duck"));
const util_1 = require("./util");
var ActionTypes;
(function (ActionTypes) {
    ActionTypes["__CLEAR__"] = "__WORKER_QUEUE__CLEAR__";
})(ActionTypes = exports.ActionTypes || (exports.ActionTypes = {}));
// Actions
// Wipe queue  ## DANGER ZONE ##
exports.__clearQueue__ = () => {
    return { type: ActionTypes.__CLEAR__ };
};
// Wrapper for external API, to remove need to call clean() action creator separately.
exports.addOrUpdateItemAndClean = function (queueItem) {
    return function addOrUpdateItemAndCleanAsync(dispatch, getState) {
        return __awaiter(this, void 0, void 0, function* () {
            dispatch(queueDuck.addOrUpdateItem(queueItem));
            yield util_1.nextTick();
            dispatch(flagDuck.clean());
        });
    };
};
const allReducers = redux_1.combineReducers({
    queue: queueDuck.default,
    flags: flagDuck.default,
});
exports.default = allReducers;
//# sourceMappingURL=duck.js.map