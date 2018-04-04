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
const WorkerQueue_1 = __importDefault(require("../WorkerQueue"));
const flagDuck = __importStar(require("./duck"));
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
const testStore = redux_1.createStore(redux_1.combineReducers({ workerQueue: workerQueue.reducers }), { workerQueue: testState }, redux_1.applyMiddleware(workerQueue.middleware));
describe('Flag thunk action creators', () => {
    // Set up a store
    test('Test store set up went fine', () => {
        expect(testStore).toBeDefined();
        expect(testStore.getState).toBeDefined();
        const storeState = testStore.getState();
        expect(storeState).toBeDefined();
        expect(storeState.workerQueue.queue).toBeDefined();
        expect(storeState.workerQueue.flags).toBeDefined();
        expect(storeState.workerQueue.queue.length).toBe(4);
        expect(storeState.workerQueue.flags.length).toBe(4);
    });
    describe('clean LOCK flags', () => {
        test('should leave LOCK flags which have not been updated', () => __awaiter(this, void 0, void 0, function* () {
            const firstState = testStore.getState();
            const lockFlag = lodash_1.find(firstState.workerQueue.flags, {
                clientMutationId: queueItemLOCKED.clientMutationId,
            });
            testStore.dispatch(flagDuck.clean());
            yield util_1.nextTick();
            const postCleanState = testStore.getState();
            expect(lodash_1.find(postCleanState.workerQueue.flags, {
                clientMutationId: queueItemLOCKED.clientMutationId,
            })).toBeDefined();
        }));
        describe('When assessing updated LOCK flags', () => {
            const queueItemLOCKED = {
                clientMutationId: 3,
                payload: {},
                type: 'PET',
                errors: [],
                createdAt: new Date().toJSON(),
            };
            // Make a lock flag with an updatedAt field, added when createdAt of first iteration found
            let lockFlag = new flag_1.FlagItem(queueItemLOCKED, { status: 'LOCKED' });
            lockFlag = new flag_1.FlagItem(queueItemLOCKED, Object.assign({}, lockFlag, { status: 'LOCKED' }));
            const testState = {
                queue: [queueItemLOCKED],
                flags: [
                    new flag_1.FlagItem(queueItemLOCKED, new flag_1.FlagItem(queueItemLOCKED, { status: 'LOCKED' })),
                ],
            };
            const updatedLocksTestStore = redux_1.createStore(redux_1.combineReducers({ workerQueue: workerQueue.reducers }), { workerQueue: testState }, redux_1.applyMiddleware(workerQueue.middleware));
            test('it should leave those whose time since update is less than the WorkerQueue lockoutPeriod', () => __awaiter(this, void 0, void 0, function* () {
                const firstState = updatedLocksTestStore.getState();
                const lockFlagInState = lodash_1.find(firstState.workerQueue.flags, {
                    clientMutationId: queueItemLOCKED.clientMutationId,
                });
                expect(lockFlagInState).toBeDefined();
                expect(lockFlagInState.updatedAt).toBeDefined();
                testStore.dispatch(flagDuck.clean());
                yield util_1.nextTick();
                const postCleanState = updatedLocksTestStore.getState();
                expect(lodash_1.find(postCleanState.workerQueue.flags, {
                    clientMutationId: queueItemLOCKED.clientMutationId,
                })).toBeDefined();
            }));
            test('it should change the status to OK for those whose time since update is more than the WorkerQueue lockoutPeriod', (done) => __awaiter(this, void 0, void 0, function* () {
                expect.assertions(3);
                workerQueue.lockoutPeriod = 1000;
                expect(workerQueue.lockoutPeriod).toEqual(1000);
                setTimeout(() => {
                    updatedLocksTestStore.dispatch(flagDuck.clean());
                    const postCleanState = updatedLocksTestStore.getState();
                    const shouldBeUnlockedFlag = lodash_1.find(postCleanState.workerQueue.flags, {
                        clientMutationId: queueItemLOCKED.clientMutationId,
                    });
                    expect(shouldBeUnlockedFlag).toBeDefined();
                    expect(shouldBeUnlockedFlag.status).toEqual('OK');
                    done();
                }, 1001);
            }));
        });
    });
});
//# sourceMappingURL=clean.locks.thunk.spec.js.map