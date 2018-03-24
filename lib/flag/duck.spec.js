"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const queue_1 = require("../queue");
const duck_1 = __importDefault(require("./duck"));
const duck_2 = require("../duck");
const queueItem = new queue_1.QueueItem({
    type: 'ITEM',
    payload: {
        satisfaction: 'awesome',
    },
});
const workingFlagBase = {
    clientMutationId: queueItem.clientMutationId,
    handlerIndex: 0,
    status: 'WORKING',
};
const workingFlagActionBase = {
    type: duck_1.FlagActionTypes.ADD_OR_UPDATE_FLAG,
    flag: workingFlagBase,
};
// Prevents weird jest-only, only-some files error: No reducer provided for key "queue"
// https://stackoverflow.com/a/47311830/2779264
jest.mock('../main'); // ie the redux store
describe('FLAG duck', () => {
    describe('Actions', () => {
        describe('addOrUpdateFlag', () => {
            test('exists', () => {
                expect(duck_1.addOrUpdateFlag).toBeDefined();
            });
            const workingFlagAction = duck_1.addOrUpdateFlag(queueItem, {
                status: 'WORKING',
                handlerIndex: 0,
            });
            test('creates an action when provided a QueueItem and settings object', () => {
                expect(workingFlagAction).toMatchObject(workingFlagActionBase);
                expect(workingFlagAction.flag).toMatchObject(workingFlagBase);
            });
            const { flag } = workingFlagAction;
            test('adds a timestamp to the flag ', () => {
                expect(typeof flag.timestamp).toEqual('number');
                expect(flag.timestamp).toBeGreaterThan(0);
            });
            test('adds a hash to the flag ', () => {
                expect(typeof flag.hash).toEqual('string');
                expect(flag.hash.length).toBeGreaterThan(0);
            });
            test('initialises the handlerIndex flag property to 0', () => {
                expect(flag.handlerIndex).toBeDefined();
                expect(flag.handlerIndex).toEqual(0);
            });
            test('strips all other properties', () => {
                const extraProps = {
                    clientMutationId: queueItem.clientMutationId,
                    handlerIndex: 0,
                    status: 'WORKING',
                };
                const shouldBeFine = duck_1.addOrUpdateFlag(queueItem, {
                    blah: 'srgdxc',
                    status: 'WORKING',
                });
                expect(shouldBeFine.flag.blah).toBeUndefined();
            });
            test('requires a queueItem to be provided', () => {
                function withoutQueueItemArg() {
                    duck_1.addOrUpdateFlag({}, { status: 'WORKING' });
                }
                expect(withoutQueueItemArg).toThrowError();
            });
            test('requires a status to be provided', () => {
                function withoutSettingsArg() {
                    duck_1.addOrUpdateFlag(queueItem);
                }
                function withoutStatusProp() {
                    duck_1.addOrUpdateFlag(queueItem, { boo: 'bah' });
                }
                expect(withoutSettingsArg).toThrowError();
                expect(withoutStatusProp).toThrowError();
            });
            test('requires a status to be WORKING|HALTED|LOCKED', () => {
                function shouldThrow() {
                    duck_1.addOrUpdateFlag(queueItem, { status: 'bah' });
                }
                expect(shouldThrow).toThrowError();
                expect(duck_1.addOrUpdateFlag(queueItem, { status: 'HALTED' }).flag.status).toEqual('HALTED');
                expect(duck_1.addOrUpdateFlag(queueItem, { status: 'WORKING' }).flag.status).toEqual('WORKING');
                expect(duck_1.addOrUpdateFlag(queueItem, { status: 'LOCKED' }).flag.status).toEqual('LOCKED');
            });
        });
        describe('removeFlag', () => {
            test('it exists', () => {
                expect(duck_1.removeFlag).toBeDefined();
            });
            test('it throws an error if called with no arguments', () => {
                function shouldError() {
                    duck_1.removeFlag();
                }
                expect(shouldError).toThrowError();
            });
            test('it makes a REMOVE_FLAG action with clientMutationId if called with clientMutationId argument', () => {
                const clientMutationId = 'erg3e';
                expect(duck_1.removeFlag(clientMutationId)).toMatchObject({
                    type: duck_1.FlagActionTypes.REMOVE_FLAG,
                    clientMutationId,
                });
            });
        });
    });
    describe('Reducer', () => {
        test('exists', () => {
            expect(duck_1.default).toBeDefined();
        });
        describe('when called with action made with...', () => {
            test(' addOrUpdateItem() --> it adds or updates a flag item', () => {
                const addFirst = duck_1.addOrUpdateFlag(queueItem, {
                    status: 'WORKING',
                });
                const firstState = duck_1.default(undefined, addFirst);
                const addSecond = duck_1.addOrUpdateFlag(queueItem, {
                    status: 'WORKING',
                    handlerIndex: 2,
                });
                // Update
                const secondState = duck_1.default(firstState, addSecond);
                expect(secondState.length).toEqual(1);
                const addThird = duck_1.addOrUpdateFlag(Object.assign({}, queueItem, { clientMutationId: '25we' }), {
                    status: 'WORKING',
                    handlerIndex: 2,
                });
                // New queueItem
                const thirdState = duck_1.default(secondState, addThird);
                expect(thirdState.length).toEqual(2);
            });
            test('removeItem() --> removes a queue item', () => {
                const addFirst = duck_1.addOrUpdateFlag(queueItem, {
                    status: 'WORKING',
                });
                const firstState = duck_1.default(undefined, addFirst);
                expect(firstState.length).toEqual(1);
                const removeAction = duck_1.removeFlag(firstState[0].clientMutationId);
                const removedState = duck_1.default(firstState, removeAction);
                expect(removedState.length).toEqual(0);
            });
            test('__clearQueue__() --> purges the queue', () => {
                const addFirst = duck_1.addOrUpdateFlag(queueItem, {
                    status: 'WORKING',
                });
                const firstState = duck_1.default(undefined, addFirst);
                expect(firstState.length).toEqual(1);
                const __clearQueue__Action = duck_2.__clearQueue__();
                const testState = duck_1.default(firstState, __clearQueue__Action);
                expect(testState.length).toEqual(0);
            });
        });
    });
});
//# sourceMappingURL=duck.spec.js.map