"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const duck_1 = require("./duck");
const flag_1 = require("../flag");
const main_1 = require("../main");
const handler = (item) => new Promise((resolve, reject) => resolve({ ok: true, item }));
const handlerType = {
    type: 'PETS',
    handlers: [handler],
};
const workerQueue = new main_1.WorkerQueue([handlerType]);
workerQueue.init();
describe('FLUSH duck', () => {
    describe('Selectors', () => {
        const queueItem1 = {
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
        const queueItemAlsoOK = {
            clientMutationId: 5,
            payload: {},
            type: 'PET',
            errors: [],
            createdAt: new Date().toJSON(),
        };
        const queueItemWithNoFlag = {
            clientMutationId: 6,
            payload: {},
            type: 'PET',
            errors: [],
            createdAt: new Date().toJSON(),
        };
        const testState = {
            queue: [
                queueItem1,
                queueItemOK,
                queueItem3,
                queueItem4,
                queueItemAlsoOK,
                queueItemWithNoFlag,
            ],
            flags: [
                new flag_1.FlagItem(queueItem1, { status: 'WORKING' }),
                new flag_1.FlagItem(queueItemOK, { status: 'OK' }),
                new flag_1.FlagItem(queueItem3, { status: 'LOCKED' }),
                new flag_1.FlagItem(queueItem4, { status: 'HALTED' }),
                new flag_1.FlagItem(queueItemAlsoOK, { status: 'OK' }),
            ],
        };
        describe('flushableItemsSelector()', () => {
            test('exists', () => {
                expect(duck_1.flushableItemsSelector).toBeDefined();
            });
            test('it selects only items with no flag, or flags with status of OK', () => {
                const flushableItems = duck_1.flushableItemsSelector(testState, workerQueue);
                expect(flushableItems).toBeDefined();
                expect(flushableItems.length).toEqual(3);
                expect(flushableItems[0].clientMutationId).toEqual(queueItemOK.clientMutationId);
            });
            test('it selects all items in the same order as the item queue', () => {
                const flushableItems = duck_1.flushableItemsSelector(testState, workerQueue);
                expect(flushableItems[0].clientMutationId).toEqual(queueItemOK.clientMutationId);
                expect(flushableItems[1].clientMutationId).toEqual(queueItemAlsoOK.clientMutationId);
                expect(flushableItems[2].clientMutationId).toEqual(queueItemWithNoFlag.clientMutationId);
            });
        });
    });
});
//# sourceMappingURL=duck.spec.js.map