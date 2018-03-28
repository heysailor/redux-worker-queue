"use strict";
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
require("jest");
const redux_1 = require("redux");
const lodash_1 = require("lodash");
const duck_1 = __importDefault(require("../duck"));
const WorkerQueue_1 = __importDefault(require("../WorkerQueue"));
const flushDuck = __importStar(require("./duck"));
// These tests use an "external" redux store to help in testing.
let itemsProcessedInOrder = [];
const itemHandlerOrder = {};
function onHandlerCalled(item, handlerName) {
    itemsProcessedInOrder = [...itemsProcessedInOrder, item.clientMutationId];
    itemHandlerOrder[item.clientMutationId] = itemHandlerOrder[item.clientMutationId]
        ? [...itemHandlerOrder[item.clientMutationId], handlerName]
        : [handlerName];
}
const handler_ONE = (item) => new Promise((resolve, reject) => {
    onHandlerCalled(item, 'ONE');
    const newItem = Object.assign({}, item, { payload: Object.assign({}, item.payload, { handledBy: [...item.payload.handledBy, 'ONE'] }) });
    if (item.payload.save) {
        resolve({ ok: true, item: newItem });
    }
    if (item.payload.halt) {
        newItem.payload.timestamp = new Date().valueOf() / 1000;
        resolve({ ok: false, item: newItem });
    }
    if (item.payload.lock) {
        // Return false with unchanged item
        const lockItem = Object.assign({}, item, { payload: Object.assign({}, item.payload) });
        resolve({ ok: false, item: lockItem });
    }
});
const initialWorkerCount = 1;
const workerQueue = new WorkerQueue_1.default({
    type: 'PET',
    handlers: [handler_ONE],
}, {
    workers: initialWorkerCount,
});
// Set up a state
const queueItem_SAVE_ME = {
    clientMutationId: 'SAVE_ME',
    payload: { save: true, handledBy: [] },
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const testState = {
    queue: [
        queueItem_SAVE_ME,
    ],
    flags: [],
};
const testStore = redux_1.createStore(redux_1.combineReducers({ workerQueue: duck_1.default }), { workerQueue: testState }, redux_1.applyMiddleware(workerQueue.middleware));
describe('FLUSH thunk action creators', () => {
    // Thunk action promise creators
    // Set up a store
    test('Test store set up went fine', () => {
        expect(testStore).toBeDefined();
        expect(testStore.getState).toBeDefined();
        const storeState = testStore.getState();
        expect(storeState).toBeDefined();
        expect(storeState.workerQueue.queue).toBeDefined();
        expect(storeState.workerQueue.flags).toBeDefined();
        expect(storeState.workerQueue.queue.length).toEqual(1);
        expect(storeState.workerQueue.flags.length).toEqual(0);
    });
    describe('flush()', () => {
        test('exists', () => {
            expect(flushDuck.flush()).toBeDefined();
        });
        test('it flushes a single queue item with handler with one worker', done => {
            testStore.dispatch(flushDuck.flush());
            function callback() {
                const flushedState = testStore.getState();
                expect(flushedState.workerQueue.queue.length).toBe(0);
                expect(lodash_1.find(flushedState.workerQueue.queue, {
                    clientMutationId: queueItem_SAVE_ME.clientMutationId,
                })).toBeUndefined();
                expect(flushedState.workerQueue.flags.length).toBe(0);
                expect(itemsProcessedInOrder.length).toBe(1);
                expect(itemHandlerOrder).toMatchObject({
                    SAVE_ME: ['ONE'],
                });
                done();
            }
            setTimeout(() => {
                callback();
            }, 500);
        });
    });
});
//# sourceMappingURL=single.flush.spec.js.map