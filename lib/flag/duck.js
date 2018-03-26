"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const flag_1 = require("./flag");
const duck_1 = require("../duck");
const util_1 = require("../util");
const store_1 = require("../store");
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
// Selectors
exports.flagsSelector = (state, workerQueueInstance) => store_1.rootSelector(state, workerQueueInstance).flags;
exports.flagByClientMutationIdSelector = (state, workerQueueInstance, clientMutationId) => lodash_1.find(exports.flagsSelector(state, workerQueueInstance), { clientMutationId });
exports.lockedFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(exports.flagsSelector(state, workerQueueInstance), { status: 'LOCKED' });
exports.workingFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(exports.flagsSelector(state, workerQueueInstance), { status: 'WORKING' });
exports.haltedFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(exports.flagsSelector(state, workerQueueInstance), { status: 'HALTED' });
exports.okFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(exports.flagsSelector(state, workerQueueInstance), { status: 'OK' });
//# sourceMappingURL=duck.js.map