import { isString } from 'lodash';
import { QueueItem } from './item';
import { Queue } from './types';
import 'jest';

// JSON ISO date matcher
// https://www.regexpal.com/97766
const DATE_CHECK = RegExp(
  '^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$'
);

describe('QueueItem', () => {
  test('should exist', () => {
    expect(QueueItem).toBeTruthy();
  });
  const starter = {
    type: 'ITEM',
    payload: {
      satisfaction: 'awesome',
    },
    naughtyProperty: 'should not be here',
  };
  const newItem = new QueueItem(starter);

  test('should instantiate with object containing type & payload properties', () => {
    expect(newItem).toBeInstanceOf(QueueItem);
  });

  test('should instantiate with object containing type & payload properties', () => {
    expect(newItem).toBeInstanceOf(QueueItem);
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
      expect(DATE_CHECK.test(newItem.createdAt)).toBeTruthy();
    });

    test('clientMutationId should be random id string', () => {
      expect(
        newItem.clientMutationId && isString(newItem.clientMutationId)
      ).toBeTruthy();
    });
  });

  describe('when given an existing item to update', () => {
    const changedItem = {
      ...newItem,
      type: 'BOO',
      payload: { ooh: 'ahh' },
    };
    const updatedItem = new QueueItem(changedItem);
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

    test('updatedAt should be a date string different to createdAt', () => {
      expect(DATE_CHECK.test(updatedItem.updatedAt)).toBeTruthy();
    });
  });
});
