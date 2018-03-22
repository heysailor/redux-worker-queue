import queue, {
  addOrUpdateItem,
  removeItem,
  __clearQueue__,
  cleanup,
  ActionTypeKeys,
} from './duck';
import { QueueItem, INewQueueItem } from '../item';
import 'jest';
import { IOtherAction } from '../actionTypes';

const queueItem: INewQueueItem = {
  workerAction: 'PICK_NOSE',
  type: 'SNOT',
  payload: {
    consistency: 'stringy',
  },
};

describe('QUEUE duck', () => {
  describe('Actions', () => {
    describe('addOrUpdateItem()', () => {
      test('it exists', () => {
        expect(addOrUpdateItem).toBeDefined();
      });

      test('it takes a new queueItem and returns an action with ADD_OR_UPDATE_ITEM actionType and item with added clientMutationID, createdAt propertied', () => {
        const action = addOrUpdateItem(queueItem);
        expect(action).toBeDefined();
        expect(action.item.clientMutationId).toBeDefined();
        expect(action.item.createdAt).toBeDefined();
      });

      test('it takes an existing queueItem and returns an action with ADD_OR_UPDATE_ITEM actionType and matching item', () => {
        const existingItem = new QueueItem(queueItem);
        const action = addOrUpdateItem(existingItem);
        expect(action).toBeDefined();
        expect(action).toMatchObject({
          type: ActionTypeKeys.ADD_OR_UPDATE_ITEM,
          item: existingItem,
        });
      });
      describe('removeItem()', () => {
        const clientMutationId = '246wetds';
        test('it exists', () => {
          expect(removeItem).toBeDefined();
        });
        test('it takes a clientMutationId and makes an action with REMOVE_ITEM actionType and matching clientMutationId', () => {
          const action = removeItem(clientMutationId);
          expect(action).toMatchObject({
            type: ActionTypeKeys.REMOVE_ITEM,
            clientMutationId,
          });
        });
      });

      describe('__clearQueue__()', () => {
        test('it exists', () => {
          expect(__clearQueue__).toBeDefined();
        });
        test('it makes an action with CLEAR actionType', () => {
          const action = __clearQueue__();
          expect(action).toMatchObject({
            type: ActionTypeKeys.__CLEAR__,
          });
        });
      });

      describe('cleanup()', () => {
        test('it exists', () => {
          expect(cleanup).toBeDefined();
        });
        test('it makes an action with CLEANUP actionType', () => {
          const action = cleanup();
          expect(action).toMatchObject({
            type: ActionTypeKeys.CLEANUP,
          });
        });
      });
    });
  });
  describe('Reducer', () => {
    const state = {
      queue: [],
    };
    const randomAction: IOtherAction = { type: ActionTypeKeys.OTHER };
    test('it exists', () => {
      expect(queue).toBeDefined();
      expect(queue).toBeInstanceOf(Function);
    });
    test('it returns an identical state object when provided state and an unknown action type', () => {
      const result = queue(state, randomAction);
      expect(result).toMatchObject(state);
    });
  });
});
