"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const redux_1 = require("redux");
const lodash_1 = require("lodash");
// import rootReducer from '../duck';
const WorkerQueue_1 = __importDefault(require("./WorkerQueue"));
require("./types");
// Test use with an external redux store.
let handlersCalledFor = [];
const handler_ONE = (item) => new Promise((resolve, reject) => {
    handlersCalledFor.push(item.clientMutationId);
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
    handlersCalledFor.push(item.clientMutationId);
    const newItem = Object.assign({}, item, { payload: Object.assign({}, item.payload, { handledBy: [...item.payload.handledBy, 'TWO'] }) });
    resolve({ ok: true, item: newItem });
});
// Initialise new queue
const initialWorkerCount = 4;
const workerQueue = new WorkerQueue_1.default({
    type: 'PET',
    handlers: [handler_ONE, handler_TWO],
}, {
    workers: initialWorkerCount,
    // Use custom root as below
    reduxRootSelector: (state) => state.persistence,
});
// Set up a sample state
const queueItem_SAVE_ME = {
    clientMutationId: 'SAVE_ME',
    payload: { save: true, handledBy: [] },
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const queueItem_ADD_ME_LATER = {
    clientMutationId: 'ADD_ME_LATER',
    payload: { save: true, handledBy: [] },
    type: 'PET',
};
const starterState = {
    queue: [
        queueItem_SAVE_ME,
    ],
    flags: [],
};
// Custom root key
const testStore = redux_1.createStore(redux_1.combineReducers({ persistence: workerQueue.reducers }), { persistence: starterState }, redux_1.applyMiddleware(workerQueue.middleware));
describe('WorkerQueue', () => {
    test('It exists as a class', () => {
        expect(WorkerQueue_1.default).toBeDefined();
        expect(workerQueue).toBeInstanceOf(WorkerQueue_1.default);
    });
    test('The test state initialised fine', () => {
        const state = testStore.getState();
        expect(state).toBeDefined();
        expect(state.persistence).toMatchObject(starterState);
    });
    describe('when initialised with external redux store', () => {
        test('it uses the reduxRootSelector setting to access the custom queue root key', () => {
            workerQueue.addOrUpdateQueueItem(queueItem_ADD_ME_LATER);
            const newState = testStore.getState();
            expect(lodash_1.find(newState.persistence.queue, { clientMutationId: 'ADD_ME_LATER' })).toMatchObject({
                clientMutationId: 'ADD_ME_LATER',
            });
        });
        test('it flushes fine', done => {
            workerQueue.flush();
            setTimeout(() => {
                const newState = testStore.getState();
                expect(handlersCalledFor.length).toBe(4);
                expect(newState.persistence.queue.length).toBe(0);
                expect(newState.persistence.flags.length).toBe(0);
                done();
            }, 50);
        });
    });
});
//# sourceMappingURL=redux.spec.js.map