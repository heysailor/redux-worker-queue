import 'jest';
// import { createStore } from 'redux';
// import thunk from 'redux-thunk';
import { Queue } from '../queue';
import { flushableItemsSelector } from './duck';
import { FlagItem } from '../flag';
import { clean } from '../flag/duck';
import { Store } from '../types';
import { HandlerPromiseResponse } from '../types';
import { store } from '../store';
import WorkerQueue from '../index';

const handler = (item: Queue.Item): Promise<HandlerPromiseResponse> =>
  new Promise((resolve, reject) => resolve({ ok: true, item }));

const handlerType = {
  type: 'PETS',
  handlers: [handler],
};
const workerQueue = new WorkerQueue([handlerType]);
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
    const testState: Store.All = {
      queue: [
        queueItem1,
        queueItemOK,
        queueItem3,
        queueItem4,
        queueItemAlsoOK,
        queueItemWithNoFlag,
      ],
      flags: [
        new FlagItem(queueItem1, { status: 'WORKING' }),
        new FlagItem(queueItemOK, { status: 'OK' }),
        new FlagItem(queueItem3, { status: 'LOCKED' }),
        new FlagItem(queueItem4, { status: 'HALTED' }),
        new FlagItem(queueItemAlsoOK, { status: 'OK' }),
      ],
    };

    describe('flushableItemsSelector()', () => {
      test('exists', () => {
        expect(flushableItemsSelector).toBeDefined();
      });

      test('it selects only items with no flag, or flags with status of OK', () => {
        const flushableItems = flushableItemsSelector(testState, workerQueue);
        expect(flushableItems).toBeDefined();
        expect(flushableItems.length).toEqual(3);
        expect(flushableItems[0].clientMutationId).toEqual(
          queueItemOK.clientMutationId
        );
      });
      test('it selects all items in the same order as the item queue', () => {
        const flushableItems = flushableItemsSelector(testState, workerQueue);

        expect(flushableItems[0].clientMutationId).toEqual(
          queueItemOK.clientMutationId
        );
        expect(flushableItems[1].clientMutationId).toEqual(
          queueItemAlsoOK.clientMutationId
        );
        expect(flushableItems[2].clientMutationId).toEqual(
          queueItemWithNoFlag.clientMutationId
        );
      });
    });
  });
});
