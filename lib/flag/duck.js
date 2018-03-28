"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const flag_1 = require("./flag");
const duck_1 = require("../queue/duck");
const duck_2 = require("../duck");
const util_1 = require("../util");
const WorkerQueue_1 = require("../WorkerQueue");
var FlagActionTypes;
(function (FlagActionTypes) {
    FlagActionTypes["ADD_OR_UPDATE_FLAG"] = "__WORKER_QUEUE__ADD_OR_UPDATE_FLAG";
    FlagActionTypes["REMOVE_FLAG"] = "__WORKER_QUEUE__REMOVE_FLAG";
})(FlagActionTypes = exports.FlagActionTypes || (exports.FlagActionTypes = {}));
// Flags represent queueItem meta.
// They need to be separate from the queueItem so that:
// - external handlers cannot alter the data
// - changing the meta does not change the queueItem, as that is how locking is determined.
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
// Activated from WorkerQueue or user generated action.
exports.clean = function () {
    return function cleanAsync(dispatch, getState) {
        return __awaiter(this, void 0, void 0, function* () {
            let state = getState();
            // Get flags which reference queue items which no longer exist.
            const irrelevant = lodash_1.differenceBy(exports.flagsSelector(state, WorkerQueue_1.INSTANCE), duck_1.queueSelector(state, WorkerQueue_1.INSTANCE), 'clientMutationId');
            if (irrelevant.length) {
                // Remove all
                yield Promise.all(irrelevant.map(flag => {
                    dispatch(removeFlag(flag.clientMutationId));
                    return util_1.nextTick();
                }));
                // Fetch changed state
                state = getState();
            }
            // Check that the locked out flags should remain that way.
            const lockedFlags = exports.lockedFlagsSelector(state, WorkerQueue_1.INSTANCE);
            const queue = duck_1.queueSelector(state, WorkerQueue_1.INSTANCE);
            if (lockedFlags.length) {
                yield Promise.all(lockedFlags.map(flag => {
                    const queueItem = lodash_1.find(queue, {
                        clientMutationId: flag.clientMutationId,
                    });
                    // Shouldn't happen, but sanity check
                    if (!queueItem)
                        return;
                    const testFlag = new flag_1.FlagItem(queueItem, flag);
                    console.log('CLEAN testflag', testFlag);
                    if (testFlag.hash !== flag.hash) {
                        // queueItem has changed, therefore out of purgatory
                        dispatch(addOrUpdateFlag(queueItem, { status: 'OK' }));
                        return util_1.nextTick();
                    }
                    else {
                        // Still in the bad books, don't change status
                        return;
                    }
                }));
            }
            // Doneskis.
            return true;
        });
    };
};
// Reducer
function flagsReducer(state = [], action) {
    switch (action.type) {
        case FlagActionTypes.ADD_OR_UPDATE_FLAG: {
            return util_1.uniqueItems(util_1.orderedItems([action.flag, ...state]));
        }
        case FlagActionTypes.REMOVE_FLAG: {
            return util_1.rejectedItems(state, action.clientMutationId);
        }
        case duck_2.ActionTypes.__CLEAR__: {
            return [];
        }
        default: {
            return state;
        }
    }
}
exports.default = flagsReducer;
// Selectors
exports.flagsSelector = (state, workerQueueInstance) => {
    return workerQueueInstance.rootSelector(state).flags;
};
exports.flagByClientMutationIdSelector = (state, workerQueueInstance, clientMutationId) => lodash_1.find(exports.flagsSelector(state, workerQueueInstance), { clientMutationId });
exports.lockedFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(exports.flagsSelector(state, workerQueueInstance), { status: 'LOCKED' });
exports.workingFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(exports.flagsSelector(state, workerQueueInstance), { status: 'WORKING' });
exports.haltedFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(exports.flagsSelector(state, workerQueueInstance), { status: 'HALTED' });
exports.okFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(exports.flagsSelector(state, workerQueueInstance), { status: 'OK' });
//# sourceMappingURL=duck.js.map