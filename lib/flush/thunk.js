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
            // Only one flush at a time.
            if (flushing) {
                return;
            }
            flushing = true;
            yield clean();
            const pullChain = function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const flushableItems = yield getFlushableItems();
                    if (!flushableItems.length)
                        return true;
                    const openWorkerSpots = WorkerQueue_1.INSTANCE.workers - activeWorkers.length;
                    if (!openWorkerSpots)
                        return true;
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
                    // console && console.log
                    //   ? console.log(
                    //       `${flushId}:${
                    //         item.createdAt
                    //       }|flushWorker fired at ${new Date().toJSON()}`
                    //     )
                    //   : null;
                    const result = yield flaggedWorker(item, flushId);
                    // console && console.log
                    //   ? console.log(
                    //       `${flushId}:${
                    //         item.createdAt
                    //       }|flushWorker finished at ${new Date().toJSON()}`
                    //     )
                    //   : null;
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
                    const assignedClientMutationIds = activeWorkers.map(reg => reg[1]);
                    const filtered = lodash_1.filter(readyInState, queueItem => assignedClientMutationIds.indexOf(queueItem.clientMutationId) < 0);
                    return filtered;
                });
            }
            function clean() {
                dispatch(flagDuck.clean());
            }
            function flagAs(queueItem, flagInput) {
                return __awaiter(this, void 0, void 0, function* () {
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
                    // We need its handlerIndex.
                    const preWorkFlag = yield getFlag(queueItem);
                    // Another worker may flag as WORKING|LOCKED|HALTED while this flush was organised. Defer to the prior worker.
                    if (preWorkFlag && preWorkFlag.status !== 'OK') {
                        return true;
                    }
                    // flag as working
                    const flag = yield flagAs(queueItem, Object.assign({}, preWorkFlag, { status: 'WORKING' }));
                    // This really shouldn't happen. Safely log, and exit.
                    if (!flag) {
                        // if (console && console.error) {
                        //   console.error(
                        //     `Flag should be present for queue item ${
                        //       queueItem.clientMutationId
                        //     }`
                        //   );
                        // }
                        return false;
                    }
                    // Is there another handler for this item, or is it done?
                    if (!WorkerQueue_1.INSTANCE.getHandlersForType(queueItem.type)[flag.handlerIndex]) {
                        yield removeQueueItem(queueItem);
                        return true;
                    }
                    const result = yield new worker_1.FlushWorker(queueItem, flag).process();
                    // Making flag directly really just to obtain the new hash value.
                    const testFlag = new flag_1.FlagItem(result.item, {
                        status: 'WORKING',
                    });
                    const itemChanged = testFlag.hash !== flag.hash;
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
                    yield save(result.item);
                    // console && console.log
                    //   ? console.log(
                    //       `[${flushId}:${
                    //         result.item.clientMutationId
                    //       }]flaggedWorker: Done, outcome flag is ${
                    //         newFlag ? newFlag.status : null
                    //       }`
                    //     )
                    //   : null;
                    return true;
                });
            }
        });
    };
};
//# sourceMappingURL=thunk.js.map