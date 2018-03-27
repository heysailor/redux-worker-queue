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
const duck_1 = require("../queue/duck");
const flag_1 = require("../flag");
const duck_2 = require("../flag/duck");
const util_1 = require("../util");
const WorkerQueue_1 = require("../WorkerQueue");
const worker_1 = require("./worker");
let flushing = false;
// Activated from WorkerQueue or user generated action.
exports.flushAsync = function () {
    return function (dispatch, getState) {
        return __awaiter(this, void 0, void 0, function* () {
            // Only one flush at a time.
            if (flushing) {
                return;
            }
            flushing = false;
            // Cleanup - remove expired Flags:WORKING|LOCKED...nextTick
            yield dispatch(duck_2.clean());
            // Recursive until no valid items left
            yield flush();
            flushing = false;
            return true;
            function flush() {
                return __awaiter(this, void 0, void 0, function* () {
                    // Next valid QueueItems
                    const state = getState();
                    // Spawn worker with waiting QueueItem to process up to the maxiumum allowed count.
                    // First, as the flags queue will likely be shorter than the item queue.
                    const workingFlags = duck_2.workingFlagsSelector(state, WorkerQueue_1.INSTANCE);
                    if (workingFlags.length >= WorkerQueue_1.INSTANCE.workers)
                        return true;
                    // Those not flagged as HALTED|WORKING
                    const flushableItems = flushableItemsSelector(state, WorkerQueue_1.INSTANCE);
                    if (!flushableItems || !flushableItems.length)
                        return true;
                    // fire off next worker
                    yield flaggedWorker(flushableItems[0]);
                    // recurse to spawn workers until no more valid items to process or all worker spots filled.
                    yield flush();
                    function flaggedWorker(queueItem) {
                        return __awaiter(this, void 0, void 0, function* () {
                            // flag as working
                            dispatch(duck_2.addOrUpdateFlag(queueItem, { status: 'WORKING' }));
                            // wait for flag to be present
                            yield util_1.nextTick();
                            // get flag
                            const state = getState();
                            const flag = duck_2.flagByClientMutationIdSelector(state, WorkerQueue_1.INSTANCE, queueItem.clientMutationId);
                            // This really shouldn't happen.
                            if (!flag) {
                                throw new Error(`Flag should be present for queue item ${queueItem.clientMutationId}`);
                            }
                            const result = yield new worker_1.FlushWorker(queueItem, flag).process();
                            // Make intermediate test flag to obtain new item hash
                            const testFlag = new flag_1.FlagItem(result.item, flag);
                            const itemChanged = testFlag.hash === flag.hash;
                            let newFlag;
                            if (!result.ok && itemChanged) {
                                // OK: false, item changed: The handler needs to halt the item so more work is done
                                newFlag = new flag_1.FlagItem(result.item, Object.assign({}, flag, { status: 'HALTED' }));
                            }
                            else if (result.ok && !itemChanged) {
                                // OK: true, item not changed: There was an error
                                newFlag = new flag_1.FlagItem(result.item, Object.assign({}, flag, { status: 'LOCKED' }));
                            }
                            else {
                                // Happy days. Item marked OK, increment to next handler.
                                newFlag = new flag_1.FlagItem(result.item, Object.assign({}, flag, { status: 'OK', handlerIndex: flag.handlerIndex + 1 }));
                            }
                            dispatch(duck_2.addOrUpdateFlag(result.item, newFlag));
                            yield util_1.nextTick();
                            return true;
                        });
                    }
                });
            }
        });
    };
};
// Selectors
function flushableItemsSelector(state, INSTANCE) {
    const badFlags = lodash_1.uniqBy([
        ...duck_2.haltedFlagsSelector(state, INSTANCE),
        ...duck_2.lockedFlagsSelector(state, INSTANCE),
        ...duck_2.workingFlagsSelector(state, INSTANCE),
    ], 'clientMutationId');
    return lodash_1.differenceBy(duck_1.queueSelector(state, INSTANCE), badFlags, 'clientMutationId');
}
exports.flushableItemsSelector = flushableItemsSelector;
//# sourceMappingURL=duck.js.map