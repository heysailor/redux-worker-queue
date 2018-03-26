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
const worker_1 = require("./worker");
const duck_1 = require("../duck");
const util_1 = require("../util");
const WorkerQueue_1 = require("../WorkerQueue");
const store_1 = require("../store");
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
            const activeWorkers = [];
            // Cleanup - remove expired Flags:WORKING|LOCKED...nextTick
            yield dispatch(duck_1.clean());
            // Wait for cleanup action to modify state
            yield util_1.nextTick();
            // Recursive until no valid items left
            yield flush();
            flushing = false;
            return true;
            function flush() {
                return __awaiter(this, void 0, void 0, function* () {
                    // Next valid QueueItems
                    const state = getState();
                    const validItems = validItemsSelector(state, WorkerQueue_1.INSTANCE);
                    // if no further valid items --> return
                    if (!validItems || !validItems.length)
                        return true;
                    // Fill workers collection up to the maxiumum allowed count with given a waiting QueueItem to process.
                    if (activeWorkers.length >= WorkerQueue_1.INSTANCE.workers)
                        return true;
                    const waitingValid = lodash_1.differenceBy(validItems, activeWorkers, 'clientMutationId');
                    if (!waitingValid.length)
                        return true;
                    // fire off next worker
                    yield registeredWorker(waitingValid[0]);
                    // recurse to spawn workers until no more valid items to process or all worker spots filled.
                    yield flush();
                    function registeredWorker(queueItem) {
                        return __awaiter(this, void 0, void 0, function* () {
                            activeWorkers.push({ clientMutationId: queueItem.clientMutationId });
                            yield new worker_1.FlushWorker(queueItem).start();
                            activeWorkers.filter((active) => active.clientMutationId === queueItem.clientMutationId);
                        });
                    }
                });
            }
        });
    };
};
// Selectors
const queueSelector = (state, workerQueueInstance) => store_1.rootSelector(state, workerQueueInstance).queue;
const flagsSelector = (state, workerQueueInstance) => store_1.rootSelector(state, workerQueueInstance).flags;
const lockedFlagsSelector = (state, workerQueueInstance) => lodash_1.filter(flagsSelector(state, workerQueueInstance), { status: 'LOCKED' });
const validItemsSelector = (state, workerQueueInstance) => 
// items which aren't locked are valid.
lodash_1.differenceBy(queueSelector(state, workerQueueInstance), lockedFlagsSelector(queueSelector, workerQueueInstance), 'clientMutationId');
//# sourceMappingURL=duck.js.map