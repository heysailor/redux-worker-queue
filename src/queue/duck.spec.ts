import queue, {
  addOrUpdateItem,
  removeItem,
  QueueActionTypeKeys,
  ItemQueue,
} from './duck';
import WorkerQueue from '../WorkerQueue';
import { IOtherAction, __clearQueue__ } from '../duck';
import { QueueItem, INewQueueItem, IQueueItem } from '../item';
import 'jest';

// Prevents weird jest-only, only-some files error: No reducer provided for key "queue"
// https://stackoverflow.com/a/47311830/2779264
jest.mock('../main'); // ie the redux store

const handler = (type: IQueueItem) =>
  new Promise((resolve, reject) => {
    resolve(true);
  });

const handlerType = {
  type: 'PETS',
  handlers: [handler],
};

describe('QUEUE duck', () => {
  const queueItem: INewQueueItem = {
    type: 'SNOT',
    payload: {
      consistency: 'stringy',
    },
  };
  // Initialise queue
  const workerQueue = new WorkerQueue([handlerType]);
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
          type: QueueActionTypeKeys.ADD_OR_UPDATE_ITEM,
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
            type: QueueActionTypeKeys.REMOVE_ITEM,
            clientMutationId,
          });
        });
      });
    });
  });
  describe('Reducer', () => {
    const state: ItemQueue = [];
    const queueItem: INewQueueItem = {
      type: 'SNOT',
      payload: {},
    };
    const randomAction: IOtherAction = { type: QueueActionTypeKeys.OTHER };
    test('it exists', () => {
      expect(queue).toBeDefined();
      expect(queue).toBeInstanceOf(Function);
    });
    test('it initializes state when called without state', () => {
      const result = queue(state, randomAction);
      expect(result).toMatchObject(state);
    });
    test('it returns an identical state object when provided state and an unknown action type', () => {
      const result = queue(state, randomAction);
      expect(result).toMatchObject(state);
    });
    describe('when called with action made with...', () => {
      test(' addOrUpdateItem() --> it adds a queue item', () => {
        const addFirst = addOrUpdateItem(queueItem);
        const firstState = queue(state, addFirst);
        const addSecond = addOrUpdateItem(queueItem);
        const secondState = queue(firstState, addSecond);
        expect(secondState.length).toEqual(2);
        expect(secondState[0]).toMatchObject(queueItem);
      });
      test('removeItem() --> removes a queue item', () => {
        const addAction = addOrUpdateItem(queueItem);
        const addedState = queue(state, addAction);
        expect(addedState.length).toEqual(1);
        const removeAction = removeItem(addedState[0].clientMutationId);
        const removedState = queue(addedState, removeAction);
        expect(removedState.length).toEqual(0);
      });
      test('__clearQueue__() --> purges the queue', () => {
        const addFirst = addOrUpdateItem(queueItem);
        const addSecond = addOrUpdateItem(queueItem);
        let testState = queue(state, addFirst);
        testState = queue(testState, addSecond);
        expect(testState.length).toEqual(2);
        const __clearQueue__Action = __clearQueue__();
        testState = queue(testState, __clearQueue__Action);
        expect(testState.length).toEqual(0);
      });
    });
  });
});
