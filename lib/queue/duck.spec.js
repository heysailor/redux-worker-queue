"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const duck_1 = __importDefault(require("./duck"));
const lodash_1 = require("lodash");
const WorkerQueue_1 = __importDefault(require("../WorkerQueue"));
const duck_2 = require("../duck");
const item_1 = require("./item");
require("jest");
// Prevents weird jest-only, only-some files error: No reducer provided for key "queue"
// https://stackoverflow.com/a/47311830/2779264
// jest.mock('../main'); // ie the redux store
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
                expect(duck_1.addOrUpdateItem).toBeDefined();
            });
            test('it takes a new queueItem and returns an action with ADD_OR_UPDATE_ITEM actionType and item with added clientMutationID, createdAt propertied', () => {
                const action = duck_1.addOrUpdateItem(queueItem);
                expect(action).toBeDefined();
                expect(action.item.clientMutationId).toBeDefined();
                expect(action.item.createdAt).toBeDefined();
            });
            test('it takes an existing queueItem and returns an action with ADD_OR_UPDATE_ITEM actionType and matching item', () => {
                const existingItem = new item_1.QueueItem(queueItem);
                const action = duck_1.addOrUpdateItem(existingItem);
                expect(action).toBeDefined();
                expect(action).toMatchObject({
                    type: duck_1.QueueActionTypes.ADD_OR_UPDATE_ITEM,
                    item: existingItem,
                });
            });
            describe('removeItem()', () => {
                const clientMutationId = '246wetds';
                test('it exists', () => {
                    expect(duck_1.removeItem).toBeDefined();
                });
                test('it takes a clientMutationId and makes an action with REMOVE_ITEM actionType and matching clientMutationId', () => {
                    const action = duck_1.removeItem(clientMutationId);
                    expect(action).toMatchObject({
                        type: duck_1.QueueActionTypes.REMOVE_ITEM,
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
            expect(duck_1.default).toBeDefined();
            expect(duck_1.default).toBeInstanceOf(Function);
        });
        test('it initializes state when called without state', () => {
            const result = duck_1.default(undefined, randomAction);
            expect(result).toMatchObject(state);
        });
        test('it returns an identical state object when provided state and an unknown action type', () => {
            const result = duck_1.default(state, randomAction);
            expect(result).toMatchObject(state);
        });
        describe('when called with action made with...', () => {
            test(' addOrUpdateItem() --> it adds a queue item', () => {
                const addFirst = duck_1.addOrUpdateItem(queueItem);
                const firstState = duck_1.default(state, addFirst);
                const addSecond = duck_1.addOrUpdateItem(queueItem);
                const secondState = duck_1.default(firstState, addSecond);
                expect(secondState.length).toEqual(2);
                expect(secondState[0]).toMatchObject(queueItem);
            });
            test(' addOrUpdateItem() --> it updates a queue item', () => {
                // Set up two items
                const addFirst = duck_1.addOrUpdateItem(queueItem);
                const firstState = duck_1.default(state, addFirst);
                const addSecond = duck_1.addOrUpdateItem(queueItem);
                const secondState = duck_1.default(firstState, addSecond);
                expect(secondState.length).toEqual(2);
                expect(secondState[0]).toMatchObject(queueItem);
                expect(secondState[1]).toMatchObject(queueItem);
                // Update the second item
                const newPayload = { boo: 'bah' };
                const updatedSecondItem = Object.assign({}, secondState[1], { payload: newPayload });
                const updateSecondItem = duck_1.addOrUpdateItem(updatedSecondItem);
                const thirdState = duck_1.default(secondState, updateSecondItem);
                expect(thirdState.length).toEqual(2);
                const updatedItem = lodash_1.find(thirdState, item => item.clientMutationId === secondState[1].clientMutationId);
                expect(updatedItem ? updatedItem.payload : undefined).toMatchObject(newPayload);
            });
            test('removeItem() --> removes a queue item', () => {
                const addAction = duck_1.addOrUpdateItem(queueItem);
                const addedState = duck_1.default(state, addAction);
                expect(addedState.length).toEqual(1);
                const removeAction = duck_1.removeItem(addedState[0].clientMutationId);
                const removedState = duck_1.default(addedState, removeAction);
                expect(removedState.length).toEqual(0);
            });
            test('__clearQueue__() --> purges the queue', () => {
                const addFirst = duck_1.addOrUpdateItem(queueItem);
                const addSecond = duck_1.addOrUpdateItem(queueItem);
                let testState = duck_1.default(state, addFirst);
                testState = duck_1.default(testState, addSecond);
                expect(testState.length).toEqual(2);
                const __clearQueue__Action = duck_2.__clearQueue__();
                testState = duck_1.default(testState, __clearQueue__Action);
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
                expect(duck_1.queueSelector).toBeDefined();
            });
            test('it selects the queue', () => {
                const fetched = duck_1.queueSelector(testState, workerQueue);
                expect(fetched[0]).toBeDefined();
                expect(fetched[0].clientMutationId).toEqual(clientMutationId);
            });
        });
    });
});
//# sourceMappingURL=duck.spec.js.map