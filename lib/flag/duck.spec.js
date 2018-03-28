"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const queue_1 = require("../queue");
const duck_1 = __importDefault(require("./duck"));
const flag_1 = require("./flag");
const duck_2 = require("../duck");
const index_1 = __importDefault(require("../index"));
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
const handler = (item) => new Promise((resolve, reject) => resolve({ ok: true, item }));
const handlerType = {
    type: 'PETS',
    handlers: [handler],
};
const workerQueue = new index_1.default([handlerType], {
    workers: 2,
});
workerQueue.init();
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
            test('adds a createdAt property to the flag ', () => {
                // JSON ISO date matcher
                // https://www.regexpal.com/97766
                const check = RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$');
                expect(check.test(flag.createdAt)).toBeTruthy();
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
                expect(testState).toMatchObject([]);
            });
        });
    });
    // Set up a state
    const queueItem1 = {
        clientMutationId: 1,
        payload: {},
        type: 'PET',
        errors: [],
        createdAt: new Date().toJSON(),
    };
    const queueItem2 = {
        clientMutationId: 2,
        payload: {},
        type: 'PET',
        errors: [],
        createdAt: new Date().toJSON(),
    };
    const queueItem3 = {
        clientMutationId: 3,
        payload: {},
        type: 'PET',
        errors: [],
        createdAt: new Date().toJSON(),
    };
    const queueItem4 = {
        clientMutationId: 4,
        payload: {},
        type: 'PET',
        errors: [],
        createdAt: new Date().toJSON(),
    };
    const testState = {
        queue: [queueItem1, queueItem2, queueItem3, queueItem4],
        flags: [
            new flag_1.FlagItem(queueItem1, { status: 'WORKING' }),
            new flag_1.FlagItem(queueItem2, { status: 'OK' }),
            new flag_1.FlagItem(queueItem3, { status: 'LOCKED' }),
            new flag_1.FlagItem(queueItem4, { status: 'HALTED' }),
        ],
    };
    describe('Selectors', () => {
        describe('flagsSelector()', () => {
            test('exists', () => {
                expect(duck_1.flagsSelector).toBeDefined();
            });
            test('it selects all flags', () => {
                const queue = duck_1.flagsSelector(testState, workerQueue);
                expect(queue).toBeDefined();
                expect(queue.length).toEqual(testState.queue.length);
                expect(queue[0].clientMutationId).toEqual(queueItem1.clientMutationId);
                expect(queue[1].clientMutationId).toEqual(queueItem2.clientMutationId);
            });
        });
        describe('flagByClientMutationIdSelector()', () => {
            test('exists', () => {
                expect(duck_1.flagByClientMutationIdSelector).toBeDefined();
            });
            test('it selects a flag by its clientMutationId', () => {
                const flag = duck_1.flagByClientMutationIdSelector(testState, workerQueue, queueItem1.clientMutationId);
                expect(flag).toBeDefined();
                expect(flag ? flag.clientMutationId : {}).toEqual(queueItem1.clientMutationId);
            });
        });
        describe('lockedFlagsSelector()', () => {
            test('exists', () => {
                expect(duck_1.lockedFlagsSelector).toBeDefined();
            });
            test('it selects only the locked flags', () => {
                const locked = duck_1.lockedFlagsSelector(testState, workerQueue);
                expect(locked).toBeDefined();
                expect(locked.length).toEqual(1);
                expect(locked && locked.length ? locked[0].clientMutationId : {}).toEqual(queueItem3.clientMutationId);
            });
        });
        describe('workingFlagsSelector()', () => {
            test('exists', () => {
                expect(duck_1.workingFlagsSelector).toBeDefined();
            });
            test('it selects only the working flags', () => {
                const working = duck_1.workingFlagsSelector(testState, workerQueue);
                expect(working).toBeDefined();
                expect(working.length).toEqual(1);
                expect(working && working.length ? working[0].clientMutationId : {}).toEqual(queueItem1.clientMutationId);
            });
        });
        describe('haltedFlagsSelector()', () => {
            test('exists', () => {
                expect(duck_1.haltedFlagsSelector).toBeDefined();
            });
            test('it selects only the halted flags', () => {
                const halted = duck_1.haltedFlagsSelector(testState, workerQueue);
                expect(halted).toBeDefined();
                expect(halted.length).toEqual(1);
                expect(halted && halted.length ? halted[0].clientMutationId : {}).toEqual(queueItem4.clientMutationId);
            });
        });
        describe('okFlagsSelector()', () => {
            test('exists', () => {
                expect(duck_1.okFlagsSelector).toBeDefined();
            });
            test('it selects only the halted flags', () => {
                const ok = duck_1.okFlagsSelector(testState, workerQueue);
                expect(ok).toBeDefined();
                expect(ok.length).toEqual(1);
                expect(ok && ok.length ? ok[0].clientMutationId : {}).toEqual(queueItem2.clientMutationId);
            });
        });
    });
});
//# sourceMappingURL=duck.spec.js.map