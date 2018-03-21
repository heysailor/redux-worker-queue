import { QueueItem, INewQueueItem, IQueueItem } from './Item';
import { isString } from 'lodash';
import 'jest';

describe('QueueItem', () => {
  test('should exist', () => {
    expect(QueueItem).toBeTruthy();
  });
  const starter = {
    type: 'ITEM',
    payload: {
      satisfaction: 'awesome',
    },
    workerAction: 'BLOW_NOSE',
  };
  const newItem = new QueueItem(starter);

  test('should instantiate with object containing type, payload, workerAction properties', () => {
    expect(newItem).toBeInstanceOf(QueueItem);
  });

  describe('when given a new item to create, properties', () => {
    test('should equal the provided properties', () => {
      expect(newItem.type).toEqual(starter.type);
      expect(newItem.payload).toEqual(starter.payload);
      expect(newItem.workerAction).toEqual(starter.workerAction);
    });

    test('should include createdAt, clientMutationId automatically', () => {
      expect(newItem.createdAt).toBeDefined();
      expect(newItem.clientMutationId).toBeDefined();
    });

    test('createdAt should be a date string', () => {
      // JSON ISO date matcher
      // https://www.regexpal.com/97766
      const check = RegExp(
        '^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$'
      );
      expect(check.test(newItem.createdAt)).toBeTruthy();
    });

    test('clientMutationId should be random id string', () => {
      expect(
        newItem.clientMutationId &&
          newItem.clientMutationId.length &&
          isString(newItem.clientMutationId)
      ).toBeTruthy();
    });
  });

  describe('when given an existing item to update', () => {
    const updatedItem = new QueueItem(newItem);
    test('clientMutationId property should remain unchanged', () => {
      expect(updatedItem.clientMutationId).toEqual(newItem.clientMutationId);
    });
    test('createdAt property should remain unchanged', () => {
      expect(updatedItem.createdAt).toEqual(newItem.createdAt);
    });
    test('payload property should remain unchanged', () => {
      expect(updatedItem.payload).toMatchObject(newItem.payload);
    });
    test('workerAction property should remain unchanged', () => {
      expect(updatedItem.workerAction).toEqual(newItem.workerAction);
    });
    test('type property should remain unchanged', () => {
      expect(updatedItem.type).toEqual(newItem.type);
    });
  });
});
