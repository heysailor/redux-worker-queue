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
const redux_1 = require("redux");
const lodash_1 = require("lodash");
const duck_1 = __importDefault(require("../duck"));
const WorkerQueue_1 = __importDefault(require("../WorkerQueue"));
const flagDuck = __importStar(require("./duck"));
const queueDuck = __importStar(require("../queue/duck"));
const flag_1 = require("./flag");
const util_1 = require("../util");
require("jest");
// These tests use an "external" redux store to help in testing.
const initialWorkerCount = 2;
const handler = (item) => new Promise((resolve, reject) => resolve({ ok: true, item }));
const workerQueue = new WorkerQueue_1.default({
    type: 'PETS',
    handlers: [handler],
}, {
    workers: initialWorkerCount,
});
// Set up a state
const queueItemWORKING = {
    clientMutationId: 1,
    payload: {},
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const queueItemOK = {
    clientMutationId: 2,
    payload: {},
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const queueItemLOCKED = {
    clientMutationId: 3,
    payload: {},
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const queueItemHALTED = {
    clientMutationId: 4,
    payload: {},
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
};
const testState = {
    queue: [queueItemWORKING, queueItemOK, queueItemLOCKED, queueItemHALTED],
    flags: [
        new flag_1.FlagItem(queueItemWORKING, { status: 'WORKING' }),
        new flag_1.FlagItem(queueItemOK, { status: 'OK' }),
        // Make flag item with identical hash, lastHash
        new flag_1.FlagItem(queueItemLOCKED, new flag_1.FlagItem(queueItemLOCKED, { status: 'LOCKED' })),
        new flag_1.FlagItem(queueItemHALTED, { status: 'HALTED' }),
    ],
};
const testStore = redux_1.createStore(redux_1.combineReducers({ workerQueue: duck_1.default }), { workerQueue: testState }, redux_1.applyMiddleware(workerQueue.middleware));
describe('Flag thunk action creators', () => {
    // Set up a store
    test('Test store set up went fine', () => {
        expect(testStore).toBeDefined();
        expect(testStore.getState).toBeDefined();
        const storeState = testStore.getState();
        expect(storeState).toBeDefined();
        expect(storeState.workerQueue.queue).toBeDefined();
        expect(storeState.workerQueue.flags).toBeDefined();
        expect(storeState.workerQueue.queue.length).toBeTruthy();
        expect(storeState.workerQueue.flags.length).toBeTruthy();
    });
    describe('clean()', () => {
        test('exists', () => {
            expect(flagDuck.clean()).toBeDefined();
        });
        const cleanPromiseCreator = flagDuck.clean();
        const cleanPromise = cleanPromiseCreator(testStore.dispatch, testStore.getState);
        test('it is a thunk action creator', () => __awaiter(this, void 0, void 0, function* () {
            // Thunk creators return a function....
            expect(cleanPromiseCreator).toBeInstanceOf(Function);
            // ...which return a Promise
            expect(cleanPromise).toBeInstanceOf(Promise);
        }));
        test('its promise resolves to a boolean, which is true', () => __awaiter(this, void 0, void 0, function* () {
            expect.assertions(1);
            const result = yield cleanPromiseCreator(testStore.dispatch, testStore.getState);
            expect(result).toEqual(true);
        }));
        test('it removes flags which reference non existent queueItems', () => __awaiter(this, void 0, void 0, function* () {
            expect.assertions(2);
            testStore.dispatch(queueDuck.addOrUpdateItem({ payload: {}, type: 'PETS' }));
            yield util_1.nextTick();
            const state = testStore.getState();
            expect(state.workerQueue.queue).toBeDefined();
            // New item is the last
            const newItem = state.workerQueue.queue[state.workerQueue.queue.length - 1];
            // Make a flag for it
            testStore.dispatch(flagDuck.addOrUpdateFlag(newItem, { status: 'WORKING' }));
            // Now get rid of it from the queue
            testStore.dispatch(queueDuck.removeItem(newItem.clientMutationId));
            // Settle state
            yield util_1.nextTick();
            const result = yield cleanPromiseCreator(testStore.dispatch, testStore.getState);
            expect(result).toEqual(true);
        }));
        test('it changes LOCKED flags for queueItems which have subsequently changed to OK', () => __awaiter(this, void 0, void 0, function* () {
            yield cleanPromiseCreator(testStore.dispatch, testStore.getState);
            let firstState = testStore.getState();
            // confirm LOCKED flag is present and correct
            const lockFlag = lodash_1.find(firstState.workerQueue.flags, { status: 'LOCKED' });
            expect(lockFlag.clientMutationId).toEqual(queueItemLOCKED.clientMutationId);
            expect(lockFlag.status).toEqual('LOCKED');
            expect(lockFlag.hash).toEqual(lockFlag.lastHash);
            // change queueItem
            const stateQueueItemLocked = lodash_1.find(firstState.workerQueue.queue, item => item.clientMutationId === lockFlag.clientMutationId);
            const newPayload = { new: 'data' };
            testStore.dispatch(queueDuck.addOrUpdateItem(Object.assign({}, stateQueueItemLocked, { payload: newPayload })));
            // Check change has occured
            const secondState = testStore.getState();
            expect(lodash_1.find(secondState.workerQueue.queue, item => item.clientMutationId === stateQueueItemLocked.clientMutationId).payload).toMatchObject(newPayload);
            // Now clean, and check flag has been removed.
            testStore.dispatch(flagDuck.clean());
            const thirdState = testStore.getState();
            const postItemChangeFlag = lodash_1.find(thirdState.workerQueue.flags, flag => flag.clientMutationId === lockFlag.clientMutationId);
            expect(postItemChangeFlag).toBeDefined();
            expect(postItemChangeFlag.status).toEqual('OK');
        }));
    });
});
//# sourceMappingURL=thunk.spec.js.map