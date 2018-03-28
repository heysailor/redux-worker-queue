"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const thunk_1 = require("./thunk");
const queueDuck = __importStar(require("../queue/duck"));
const flagDuck = __importStar(require("../flag/duck"));
// Selectors
function flushableItemsSelector(state, INSTANCE) {
    const badFlags = lodash_1.uniqBy([
        ...flagDuck.haltedFlagsSelector(state, INSTANCE),
        ...flagDuck.lockedFlagsSelector(state, INSTANCE),
        ...flagDuck.workingFlagsSelector(state, INSTANCE),
    ], 'clientMutationId');
    return lodash_1.differenceBy(queueDuck.queueSelector(state, INSTANCE), badFlags, 'clientMutationId');
}
exports.flushableItemsSelector = flushableItemsSelector;
// Thunks
exports.flush = thunk_1.flush;
//# sourceMappingURL=duck.js.map