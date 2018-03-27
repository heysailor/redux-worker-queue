"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const shortid_1 = __importDefault(require("shortid"));
const flag_1 = require("../flag");
const util_1 = require("../util");
const worker_1 = require("./worker");
const WorkerQueue_1 = require("../WorkerQueue");
const flushDuck = __importStar(require("./duck"));
const flagDuck = __importStar(require("../flag/duck"));
const duck_1 = require("../queue/duck");
let flushing = false;
let activeWorkers = [];
// Activated from WorkerQueue or user generated action.
exports.flush = function () {
    return function flushAsync(dispatch, getState) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('FLUSHING TRIGGERED', flushing, shortid_1.default.generate());
            // Only one flush at a time.
            if (flushing) {
                return;
            }
            flushing = true;
            yield clean();
            const pullChain = function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const flushableItems = yield getFlushableItems();
                    console.log(`PULL CHAIN: These items are ready to go: ${flushableItems.map(item => `${item.clientMutationId}`)}`);
                    if (!flushableItems.length)
                        return true;
                    const openWorkerSpots = WorkerQueue_1.INSTANCE.workers - activeWorkers.length;
                    if (!openWorkerSpots)
                        return true;
                    console.log(`PULL CHAIN: We can launch ${openWorkerSpots} workers`);
                    const next = flushableItems.slice(0, openWorkerSpots);
                    yield Promise.race(next.map((item) => __awaiter(this, void 0, void 0, function* () {
                        yield flush(item);
                        // Recurse. Wheeee!
                    })));
                    return pullChain();
                });
            };
            yield pullChain();
            function flush(item) {
                return __awaiter(this, void 0, void 0, function* () {
                    const flushId = shortid_1.default.generate();
                    activeWorkers.push([flushId, item.clientMutationId]);
                    console.log(`PULL CHAIN|FLUSH:${flushId} fired at ${new Date().toJSON()}`);
                    console.log(activeWorkers);
                    const result = yield flaggedWorker(item, flushId);
                    console.log(`PULL CHAIN|FLUSH:${flushId} finished at ${new Date().toJSON()}`);
                    activeWorkers = lodash_1.remove(activeWorkers, reg => reg[0] === flushId);
                    return result;
                });
            }
            function getFlushableItems() {
                return __awaiter(this, void 0, void 0, function* () {
                    const state = getState();
                    // Those not flagged as HALTED|WORKING, and not assigned a flush worker
                    yield util_1.nextTick();
                    const readyInState = flushDuck.flushableItemsSelector(state, WorkerQueue_1.INSTANCE);
                    console.log('Ready in state', readyInState.map(ready => ready.clientMutationId));
                    console.log('activeWorkers', activeWorkers);
                    const assignedClientMutationIds = activeWorkers.map(reg => reg[1]);
                    console.log('assignedClientMutationIds', assignedClientMutationIds);
                    const filtered = lodash_1.filter(readyInState, queueItem => assignedClientMutationIds.indexOf(queueItem.clientMutationId) < 0);
                    console.log('filtered', filtered.map(ready => ready.clientMutationId));
                    return filtered;
                });
            }
            function clean() {
                dispatch(flagDuck.clean());
                // await nextTick();
            }
            function flagAs(queueItem, flagInput) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log('FLAGGING AS', queueItem.clientMutationId, flagInput.status);
                    dispatch(flagDuck.addOrUpdateFlag(queueItem, flagInput));
                    yield util_1.nextTick();
                    // get flag
                    const newFlag = yield getFlag(queueItem);
                    if (!newFlag)
                        throw new Error('Could not flag queueItem');
                    return newFlag;
                });
            }
            function getFlag(queueItem) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield util_1.nextTick();
                    return flagDuck.flagByClientMutationIdSelector(getState(), WorkerQueue_1.INSTANCE, queueItem.clientMutationId);
                });
            }
            function removeQueueItem(queueItem) {
                dispatch(duck_1.removeItem(queueItem.clientMutationId));
                dispatch(flagDuck.removeFlag(queueItem.clientMutationId));
                // await nextTick();
            }
            function save(queueItem) {
                dispatch(duck_1.addOrUpdateItem(queueItem));
                // await nextTick();
            }
            function flaggedWorker(queueItem, flushId) {
                return __awaiter(this, void 0, void 0, function* () {
                    // console.log(
                    //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: triggered for queueItem`,
                    //   queueItem
                    // );
                    // console.log(
                    //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: adding WORKING flag for CMID ${
                    //     queueItem.clientMutationId
                    //   }`
                    // );
                    // We need its handlerIndex.
                    const preWorkFlag = yield getFlag(queueItem);
                    console.log('Flag for item:', queueItem.clientMutationId, preWorkFlag ? preWorkFlag.status : null);
                    // Another worker may flag as WORKING|LOCKED|HALTED while this flush was organised. Defer to the prior worker.
                    if (preWorkFlag && preWorkFlag.status !== 'OK') {
                        return true;
                    }
                    // flag as working
                    const flag = yield flagAs(queueItem, Object.assign({}, preWorkFlag, { status: 'WORKING' }));
                    // console.log(
                    //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: flag for CMID ${
                    //     queueItem.clientMutationId
                    //   } is`,
                    //   flag
                    // );
                    // This really shouldn't happen. Safely log, and exit.
                    if (!flag) {
                        if (console && console.error) {
                            console.error(`Flag should be present for queue item ${queueItem.clientMutationId}`);
                        }
                        return false;
                    }
                    // Is there another handler for this item, or is it done?
                    if (!WorkerQueue_1.INSTANCE.getHandlersForType(queueItem.type)[flag.handlerIndex]) {
                        // console.log(
                        //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: goodbye pork pie, CMID ${
                        //     queueItem.clientMutationId
                        //   }`
                        // );
                        yield removeQueueItem(queueItem);
                        console.log(`PULL CHAIN|FLUSH:${flushId}|flaggedWorker: doneskis on ${queueItem.clientMutationId}`, queueItem.payload.handledBy);
                        return true;
                    }
                    // console.log(
                    //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: spawing new FlushWorker`
                    // );
                    const result = yield new worker_1.FlushWorker(queueItem, flag).process();
                    // console.log(
                    //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker|FlushWorker: result`,
                    //   result
                    // );
                    // Making flag directly really just to obtain the new hash value.
                    const testFlag = new flag_1.FlagItem(result.item, {
                        status: 'WORKING',
                    });
                    const itemChanged = testFlag.hash !== flag.hash;
                    // console.log(
                    //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: itemChanged ${itemChanged}`
                    // );
                    let newFlag;
                    if (!result.ok && itemChanged) {
                        // OK: false, item changed: The handler needs to halt the item so more work is done
                        newFlag = yield flagAs(result.item, Object.assign({}, flag, { status: 'HALTED' }));
                    }
                    else if (!result.ok && !itemChanged) {
                        // OK: false, item not changed: There was a coding error/the handler didn't catch an error; prevent endless loop.
                        newFlag = yield flagAs(result.item, Object.assign({}, flag, { status: 'LOCKED' }));
                    }
                    else {
                        // Happy days. Item marked OK, doesn't matter if changed. Increment to next handler.
                        newFlag = yield flagAs(result.item, Object.assign({}, flag, { status: 'OK', handlerIndex: flag.handlerIndex + 1 }));
                    }
                    // console.log(`PULL CHAIN|FLUSH:${flushId}|flaggedWorker: saving item`);
                    yield save(result.item);
                    console.log(`PULL CHAIN|FLUSH:${flushId}|flaggedWorker: Done, outcome flag is`, newFlag, result.item.payload.handledBy);
                    return true;
                });
            }
        });
    };
};
//# sourceMappingURL=thunk.js.map