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
const flagDuck = __importStar(require("../flag/duck"));
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
const handler_TWO = (item) => new Promise((resolve, reject) => {
    onHandlerCalled(item, 'TWO');
    const newItem = Object.assign({}, item, { payload: Object.assign({}, item.payload, { handledBy: [...item.payload.handledBy, 'TWO'] }) });
    resolve({ ok: true, item: newItem });
});
const initialWorkerCount = 4;
const workerQueue = new WorkerQueue_1.default({
    type: 'PET',
    handlers: [handler_ONE, handler_TWO],
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
const queueItem_HALT_ME = {
    clientMutationId: 'HALT_ME',
    payload: { halt: true, handledBy: [], deeply: { nested: 'stuff' } },
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const queueItem_LOCK_ME = {
    clientMutationId: 'LOCK_ME',
    payload: { lock: true, handledBy: [] },
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const queueItem_SAVE_ME_TOO = {
    clientMutationId: 'SAVE_ME_TOO',
    payload: { save: true, handledBy: [] },
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const queueItem_HEY_SAVE_ME_TOO = {
    clientMutationId: 'HEY_SAVE_ME_TOO',
    payload: { save: true, handledBy: [] },
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const testState = {
    queue: [
        queueItem_SAVE_ME,
        queueItem_HALT_ME,
        queueItem_LOCK_ME,
        queueItem_SAVE_ME_TOO,
        queueItem_HEY_SAVE_ME_TOO,
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
        expect(storeState.workerQueue.queue.length).toEqual(5);
        expect(storeState.workerQueue.flags.length).toEqual(0);
    });
    describe('flush()', () => {
        test('exists', () => {
            expect(flushDuck.flush()).toBeDefined();
        });
        describe('clean()', () => {
            test('exists', () => {
                expect(flagDuck.clean()).toBeDefined();
            });
            test('it flushes the queue items with handlers in order, with the max allowed workers', done => {
                testStore.dispatch(flushDuck.flush());
                function callback() {
                    const flushedState = testStore.getState();
                    expect(flushedState.workerQueue.queue.length).toBe(2);
                    expect(lodash_1.find(flushedState.workerQueue.queue, {
                        clientMutationId: queueItem_HALT_ME.clientMutationId,
                    })).toBeTruthy();
                    expect(lodash_1.find(flushedState.workerQueue.queue, {
                        clientMutationId: queueItem_LOCK_ME.clientMutationId,
                    })).toBeTruthy();
                    expect(flushedState.workerQueue.flags.length).toBe(2);
                    const halted = lodash_1.find(flushedState.workerQueue.queue, {
                        clientMutationId: queueItem_HALT_ME.clientMutationId,
                    });
                    expect(halted).toBeTruthy();
                    expect(halted.payload.deeply.nested).toBe('stuff');
                    expect(lodash_1.find(flushedState.workerQueue.flags, {
                        clientMutationId: queueItem_HALT_ME.clientMutationId,
                    })).toMatchObject({
                        status: 'HALTED',
                    });
                    expect(lodash_1.find(flushedState.workerQueue.flags, {
                        clientMutationId: queueItem_LOCK_ME.clientMutationId,
                    })).toMatchObject({
                        status: 'LOCKED',
                    });
                    // order very difficult to test, as workers on different threads[ish].
                    expect(itemsProcessedInOrder.length).toBe(8);
                    expect(itemHandlerOrder).toMatchObject({
                        HALT_ME: ['ONE'],
                        HEY_SAVE_ME_TOO: ['ONE', 'TWO'],
                        LOCK_ME: ['ONE'],
                        SAVE_ME: ['ONE', 'TWO'],
                        SAVE_ME_TOO: ['ONE', 'TWO'],
                    });
                    done();
                }
                setTimeout(() => {
                    callback();
                }, 50);
            });
        });
    });
});
//# sourceMappingURL=flush.spec.js.map