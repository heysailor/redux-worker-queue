"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flag_1 = require("./flag");
const duck_1 = require("../duck");
const util_1 = require("../util");
var FlagActionTypes;
(function (FlagActionTypes) {
    FlagActionTypes["ADD_OR_UPDATE_FLAG"] = "__WORKER_QUEUE__ADD_OR_UPDATE_FLAG";
    FlagActionTypes["REMOVE_FLAG"] = "__WORKER_QUEUE__REMOVE_FLAG";
})(FlagActionTypes = exports.FlagActionTypes || (exports.FlagActionTypes = {}));
// Actions
function addOrUpdateFlag(queueItem, flag) {
    if (!queueItem || !queueItem.clientMutationId || !queueItem.payload) {
        throw new Error('Must provide a queueItem as first argument');
    }
    if (!flag || !flag.status) {
        throw new Error('Must provide a flag with status property as second argument');
    }
    return {
        type: FlagActionTypes.ADD_OR_UPDATE_FLAG,
        flag: new flag_1.FlagItem(queueItem, flag),
    };
}
exports.addOrUpdateFlag = addOrUpdateFlag;
function removeFlag(clientMutationId) {
    if (!clientMutationId) {
        throw new Error('Must provide the relevant QueueItem.clientMutationId');
    }
    return {
        type: FlagActionTypes.REMOVE_FLAG,
        clientMutationId,
    };
}
exports.removeFlag = removeFlag;
// Reducer
function flag(state = [], action) {
    switch (action.type) {
        case FlagActionTypes.ADD_OR_UPDATE_FLAG: {
            return util_1.uniqueItems([action.flag, ...state]);
        }
        case FlagActionTypes.REMOVE_FLAG: {
            return util_1.rejectedItems(state, action.clientMutationId);
        }
        case duck_1.ActionTypes.__CLEAR__: {
            return [];
        }
    }
    return [];
}
exports.default = flag;
//# sourceMappingURL=duck.js.map