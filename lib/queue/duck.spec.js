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
const lodash_1 = require("lodash");
const WorkerQueue_1 = __importDefault(require("../WorkerQueue"));
const item_1 = require("./item");
const queueDuck = __importStar(require("./duck"));
const rootDuck = __importStar(require("../duck"));
const handler = (item) => new Promise((resolve, reject) => resolve({ ok: true, item }));
const handlerType = {
    type: 'PETS',
    handlers: [handler],
};
const workerQueue = new WorkerQueue_1.default([handlerType]);
describe('QUEUE duck', () => {
    const queueItem = {
        type: 'SNOT',
        payload: {
            consistency: 'stringy',
        },
    };
    // Initialise queue
    describe('Actions', () => {
        describe('addOrUpdateItem()', () => {
            test('it exists', () => {
                expect(queueDuck.addOrUpdateItem).toBeDefined();
            });
            test('it takes a new queueItem and returns an action with ADD_OR_UPDATE_ITEM actionType and item with added clientMutationID, createdAt propertied', () => {
                const action = queueDuck.addOrUpdateItem(queueItem);
                expect(action).toBeDefined();
                expect(action.item.clientMutationId).toBeDefined();
                expect(action.item.createdAt).toBeDefined();
            });
            test('it takes an existing queueItem and returns an action with ADD_OR_UPDATE_ITEM actionType and matching item', () => {
                const existingItem = new item_1.QueueItem(queueItem);
                const action = queueDuck.addOrUpdateItem(existingItem);
                expect(action).toBeDefined();
                expect(action).toMatchObject({
                    type: queueDuck.QueueActionTypes.ADD_OR_UPDATE_ITEM,
                    item: existingItem,
                });
            });
            describe('removeItem()', () => {
                const clientMutationId = '246wetds';
                test('it exists', () => {
                    expect(queueDuck.removeItem).toBeDefined();
                });
                test('it takes a clientMutationId and makes an action with REMOVE_ITEM actionType and matching clientMutationId', () => {
                    const action = queueDuck.removeItem(clientMutationId);
                    expect(action).toMatchObject({
                        type: queueDuck.QueueActionTypes.REMOVE_ITEM,
                        clientMutationId,
                    });
                });
            });
        });
    });
    describe('Reducer', () => {
        const state = [];
        const queueItem = {
            type: 'SNOT',
            payload: {},
        };
        const randomAction = { type: 'Rubbish' };
        test('it exists', () => {
            expect(queueDuck.default).toBeDefined();
            expect(queueDuck.default).toBeInstanceOf(Function);
        });
        test('it initializes state when called without state', () => {
            const result = queueDuck.default(undefined, randomAction);
            expect(result).toMatchObject(state);
        });
        test('it returns an identical state object when provided state and an unknown action type', () => {
            const result = queueDuck.default(state, randomAction);
            expect(result).toMatchObject(state);
        });
        describe('when called with action made with...', () => {
            test('addOrUpdateItem() --> it adds a queue item', () => {
                const addFirst = queueDuck.addOrUpdateItem(queueItem);
                const firstState = queueDuck.default(state, addFirst);
                const addSecond = queueDuck.addOrUpdateItem(queueItem);
                const secondState = queueDuck.default(firstState, addSecond);
                expect(secondState.length).toEqual(2);
                expect(secondState[0]).toMatchObject(queueItem);
            });
            test(' addOrUpdateItem() --> it updates a queue item', () => {
                // Set up two items
                const addFirst = queueDuck.addOrUpdateItem(queueItem);
                const firstState = queueDuck.default(state, addFirst);
                const addSecond = queueDuck.addOrUpdateItem(queueItem);
                const secondState = queueDuck.default(firstState, addSecond);
                expect(secondState.length).toEqual(2);
                expect(secondState[0]).toMatchObject(queueItem);
                expect(secondState[1]).toMatchObject(queueItem);
                // Update the second item
                const newPayload = { boo: 'bah' };
                const updatedSecondItem = Object.assign({}, secondState[1], { payload: newPayload });
                const updateSecondItem = queueDuck.addOrUpdateItem(updatedSecondItem);
                const thirdState = queueDuck.default(secondState, updateSecondItem);
                expect(thirdState.length).toEqual(2);
                const updatedItem = lodash_1.find(thirdState, item => item.clientMutationId === secondState[1].clientMutationId);
                expect(updatedItem ? updatedItem.payload : undefined).toMatchObject(newPayload);
            });
            test('removeItem() --> removes a queue item', () => {
                const addAction = queueDuck.addOrUpdateItem(queueItem);
                const addedState = queueDuck.default(state, addAction);
                expect(addedState.length).toEqual(1);
                const removeAction = queueDuck.removeItem(addedState[0].clientMutationId);
                const removedState = queueDuck.default(addedState, removeAction);
                expect(removedState.length).toEqual(0);
            });
            test('__clearQueue__() --> purges the queue', () => {
                const addFirst = queueDuck.addOrUpdateItem(queueItem);
                const addSecond = queueDuck.addOrUpdateItem(queueItem);
                let testState = queueDuck.default(state, addFirst);
                testState = queueDuck.default(testState, addSecond);
                expect(testState.length).toEqual(2);
                const __clearQueue__Action = rootDuck.__clearQueue__();
                testState = queueDuck.default(testState, __clearQueue__Action);
                expect(testState.length).toEqual(0);
            });
        });
    });
    describe('Selectors', () => {
        const clientMutationId = 'sdgxcv';
        const testState = {
            queue: [
                {
                    clientMutationId,
                    payload: {},
                    type: 'PET',
                    errors: [],
                    createdAt: new Date().toJSON(),
                },
            ],
            flags: [],
        };
        describe('queueSelector()', () => {
            test('it exists', () => {
                expect(queueDuck.queueSelector).toBeDefined();
            });
            test('it selects the queue', () => {
                const fetched = queueDuck.queueSelector(testState, workerQueue);
                expect(fetched[0]).toBeDefined();
                expect(fetched[0].clientMutationId).toEqual(clientMutationId);
            });
        });
        describe('queueItemByClientMutationIdSelector()', () => {
            test('it exists', () => {
                expect(queueDuck.queueItemByClientMutationIdSelector).toBeDefined();
            });
            test('it finds a queueItem by its clientMutationId', () => {
                const fetched = queueDuck.queueItemByClientMutationIdSelector(testState, clientMutationId);
                expect(fetched).toBeDefined();
                expect(fetched.clientMutationId).toEqual(clientMutationId);
            });
        });
    });
});
//# sourceMappingURL=duck.spec.js.map