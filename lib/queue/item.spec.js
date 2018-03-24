"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const item_1 = require("./item");
require("jest");
describe('QueueItem', () => {
    test('should exist', () => {
        expect(item_1.QueueItem).toBeTruthy();
    });
    const starter = {
        type: 'ITEM',
        payload: {
            satisfaction: 'awesome',
        },
        naughtyProperty: 'should not be here',
    };
    const newItem = new item_1.QueueItem(starter);
    test('should instantiate with object containing type & payload properties', () => {
        expect(newItem).toBeInstanceOf(item_1.QueueItem);
    });
    test('should instantiate with object containing type & payload properties', () => {
        expect(newItem).toBeInstanceOf(item_1.QueueItem);
    });
    describe('when given a new item to create, the new item', () => {
        test('should equal the provided properties', () => {
            expect(newItem.type).toEqual(starter.type);
            expect(newItem.payload).toEqual(starter.payload);
        });
        test('should ignore non-specified properties', () => {
            expect(newItem.naughtyProperty).toBeUndefined();
        });
        test('createdAt should be a date string', () => {
            // JSON ISO date matcher
            // https://www.regexpal.com/97766
            const check = RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$');
            expect(check.test(newItem.createdAt)).toBeTruthy();
        });
        test('clientMutationId should be random id string', () => {
            expect(newItem.clientMutationId && lodash_1.isString(newItem.clientMutationId)).toBeTruthy();
        });
    });
    describe('when given an existing item to update', () => {
        const changedItem = Object.assign({}, newItem, { type: 'BOO', payload: { ooh: 'ahh' } });
        const updatedItem = new item_1.QueueItem(changedItem);
        test('clientMutationId property should remain unchanged', () => {
            expect(updatedItem.clientMutationId).toEqual(newItem.clientMutationId);
        });
        test('createdAt property should remain unchanged', () => {
            expect(updatedItem.createdAt).toEqual(newItem.createdAt);
        });
        test('payload property should change', () => {
            expect(updatedItem.payload).toEqual(changedItem.payload);
        });
        // Probably unwise, but someone might want to for some reason...
        test('type property should change', () => {
            expect(updatedItem.type).toEqual(changedItem.type);
        });
    });
});
//# sourceMappingURL=item.spec.js.map