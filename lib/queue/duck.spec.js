"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const duck_1 = __importDefault(require("./duck"));
const Queue_1 = __importDefault(require("./Queue"));
const item_1 = require("../item");
require("jest");
// Prevents weird jest-only, only-some files error: No reducer provided for key "queue"
// https://stackoverflow.com/a/47311830/2779264
jest.mock('../main'); // ie the redux store
describe('QUEUE duck', () => {
    const queueItem = {
        type: 'SNOT',
        payload: {
            consistency: 'stringy',
        },
    };
    // Initialise queue
    const workerQueue = new Queue_1.default();
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
                    type: duck_1.ActionTypeKeys.ADD_OR_UPDATE_ITEM,
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
                        type: duck_1.ActionTypeKeys.REMOVE_ITEM,
                        clientMutationId,
                    });
                });
            });
            describe('__clearQueue__()', () => {
                test('it exists', () => {
                    expect(duck_1.__clearQueue__).toBeDefined();
                });
                test('it makes an action with CLEAR actionType', () => {
                    const action = duck_1.__clearQueue__();
                    expect(action).toMatchObject({
                        type: duck_1.ActionTypeKeys.__CLEAR__,
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
        const randomAction = { type: duck_1.ActionTypeKeys.OTHER };
        test('it exists', () => {
            expect(duck_1.default).toBeDefined();
            expect(duck_1.default).toBeInstanceOf(Function);
        });
        test('it initializes state when called without state', () => {
            const result = duck_1.default(state, randomAction);
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
                const __clearQueue__Action = duck_1.__clearQueue__();
                testState = duck_1.default(testState, __clearQueue__Action);
                expect(testState.length).toEqual(0);
            });
        });
    });
});
//# sourceMappingURL=duck.spec.js.map