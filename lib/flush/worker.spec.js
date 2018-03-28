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
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const jest_mock_console_1 = __importDefault(require("jest-mock-console"));
const redux_1 = require("redux");
// import rootReducer from '../duck';
const WorkerQueue_1 = __importDefault(require("../WorkerQueue"));
const flag_1 = require("../flag");
require("./types");
// Test use with an external redux store,
// need state as FlushWorker depends on a worker queue instance with regsitered handlers
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
const HANDLER_ERROR_MESSAGE = 'I fucked up, handlers should always resolve to the standard response object.';
const handler_WITH_CODING_ERROR = (item) => new Promise((resolve, reject) => {
    reject(HANDLER_ERROR_MESSAGE);
});
// Initialise new queue
const initialWorkerCount = 4;
const workerQueue = new WorkerQueue_1.default({
    type: 'PET',
    handlers: [handler_ONE, handler_WITH_CODING_ERROR],
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
const okFlag = new flag_1.FlagItem(queueItem_SAVE_ME, {
    status: 'OK',
});
const queueItem_UNREGISTERED = {
    clientMutationId: 'SAVE_ME',
    payload: { save: true, handledBy: [] },
    type: 'ZOMBIE',
    errors: [],
    createdAt: new Date().toJSON(),
};
const zombieFlag = new flag_1.FlagItem(queueItem_SAVE_ME, {
    status: 'OK',
});
// const queueItem_ADD_ME_LATER = {
//   clientMutationId: 'ADD_ME_LATER',
//   payload: { save: true, handledBy: [] },
//   type: 'PET',
// };
const starterState = {
    queue: [],
    flags: [],
};
// Custom root key
const testStore = redux_1.createStore(redux_1.combineReducers({ persistence: workerQueue.reducers }), { persistence: starterState }, redux_1.applyMiddleware(workerQueue.middleware));
const worker_1 = require("./worker");
describe('Worker', () => {
    const worker = new worker_1.FlushWorker(queueItem_SAVE_ME, okFlag);
    test('exists as a class', () => {
        expect(worker).toBeInstanceOf(worker_1.FlushWorker);
    });
    describe('process()', () => {
        test('it demands the queue item type be registered', () => __awaiter(this, void 0, void 0, function* () {
            expect.assertions(1);
            const zombieWorker = new worker_1.FlushWorker(queueItem_UNREGISTERED, zombieFlag);
            return expect(zombieWorker.process()).rejects.toMatchObject(new Error('Must register at least one handler for ZOMBIE type of queue item.'));
        }));
        test('if the flag calls for a handlerIndex beyond the number registered, it returns ok: true', () => __awaiter(this, void 0, void 0, function* () {
            expect.assertions(1);
            const handlerBeyondFlag = new flag_1.FlagItem(queueItem_SAVE_ME, {
                status: 'OK',
                handlerIndex: 3,
            });
            const worker = new worker_1.FlushWorker(queueItem_SAVE_ME, handlerBeyondFlag);
            return expect(worker.process()).resolves.toMatchObject({
                ok: true,
                item: queueItem_SAVE_ME,
            });
        }));
        test('if the handler has a coding snafu and returns an error, it console.error()s a helpful message and resolves ok: false.', (done) => __awaiter(this, void 0, void 0, function* () {
            expect.assertions(2);
            jest_mock_console_1.default();
            const ERROR_MESSAGE = `Your handler for queued item with clientMutationId ${queueItem_SAVE_ME.clientMutationId} of type ${queueItem_SAVE_ME.type} returned an error, which is bad. Handlers should _always_ return { ok: boolean, item: QueueItem }. Place any errors in QueueItem.errors. The error was '${HANDLER_ERROR_MESSAGE}'`;
            const triggerHandlerWithErrorFlag = new flag_1.FlagItem(queueItem_SAVE_ME, {
                status: 'OK',
                handlerIndex: 1,
            });
            const worker = new worker_1.FlushWorker(queueItem_SAVE_ME, triggerHandlerWithErrorFlag);
            expect(worker.process()).resolves.toMatchObject({
                ok: false,
                item: queueItem_SAVE_ME,
            });
            setTimeout(() => {
                expect(console.error).toHaveBeenCalledWith(ERROR_MESSAGE);
                done();
            }, 10);
        }));
    });
});
//# sourceMappingURL=worker.spec.js.map