"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = require("redux-saga");
const effects_1 = require("redux-saga/effects");
const duck_1 = require("../duck");
// import { validQueueItemsSelector } from './selectors';
// Selectors
// TODO valid items selector with reselect
// Sagas
let flushing = false;
let processedCount = 0;
const workers = [];
function* coordinator() {
    // 1. Return if flushing already
    if (flushing) {
        yield processedCount;
    }
    else {
        // 2. yield put cleanup call.
        yield effects_1.put(duck_1.clean());
        // 3. yield nextTick. Sagas are meant to be called after reducers, so state
        // should be updated, but if preceeding (external) middleware is
        // asynchronous (unusual) then it'll be out.
        yield redux_saga_1.delay(1);
        // 4. select valid items in queue
        // TODO const validQueueItems = yield select(...valid items selector)
        // if no valid items
        // workers = [], flushing = false, copy processedCount, processedCount = 0; return copy of processedCount
        // else add valid*workers(queueItem) < MAX_WORKERS to workers[]
        // on worker promise completion loop to 2.
        //   1. Coordinator activated redux saga ie from WorkerQueue or user generated action.
        // 2. Cleanup called - remove expired Flags:WORKING|LOCKED...nextTick
        // 3. Coordinator finds next valid QueueItems
        //     -- if no further valid items --> resolves with processed count.
        // 4. Fills its workers collection up to the maxiumum allowed count with workers given a QueueItem to process.
        // 5. Worker ensures Flag:WORKING action...nextTick
        // 6. Worker calls first or next applicable handler.
        //     -- ok: true, no next handler --> success, Flag:removed, Item removed from queue --> 8
        //     -- ok: false, Item altered --> Flag: HALTED --> 8
        //     -- promise rejected/ok: false and Item not altered/Error --> Flag:LOCKED --> 8
        // 7. ok: true & next handler --> worker recurses to 5.
        // 8. Worker resolves its promise to Coordinator
        // 9. Coordinator recurses to 3.
    }
}
function* onFlush() {
    yield effects_1.takeEvery(duck_1.ActionTypes.FLUSH, coordinator);
}
exports.sagas = {
    onFlush,
};
//# sourceMappingURL=sagas.js.map