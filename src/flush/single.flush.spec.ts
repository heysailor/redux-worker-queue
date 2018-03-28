import 'jest';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { find } from 'lodash';

import rootReducer from '../duck';
import WorkerQueue from '../WorkerQueue';

import { Queue } from '../queue';
import { FlagItem } from '../flag';

import { HandlerPromiseResponse } from '../types';
import { Store } from '../types';

import * as flagDuck from '../flag/duck';
import * as flushDuck from './duck';

// These tests use an "external" redux store to help in testing.

let itemsProcessedInOrder: ClientMutationId[] = [];
const itemHandlerOrder: { [key: string]: string[] } = {};

function onHandlerCalled(item: Queue.Item, handlerName: string) {
  itemsProcessedInOrder = [...itemsProcessedInOrder, item.clientMutationId];
  itemHandlerOrder[item.clientMutationId] = itemHandlerOrder[
    item.clientMutationId
  ]
    ? [...itemHandlerOrder[item.clientMutationId], handlerName]
    : [handlerName];
}

const handler_ONE = (item: Queue.Item): Promise<HandlerPromiseResponse> =>
  new Promise((resolve, reject) => {
    onHandlerCalled(item, 'ONE');
    const newItem: Queue.Item = {
      ...item,
      payload: {
        ...item.payload,
        handledBy: [...item.payload.handledBy, 'ONE'],
      },
    };

    if (item.payload.save) {
      resolve({ ok: true, item: newItem });
    }

    if (item.payload.halt) {
      newItem.payload.timestamp = new Date().valueOf() / 1000;
      resolve({ ok: false, item: newItem });
    }

    if (item.payload.lock) {
      // Return false with unchanged item
      const lockItem = { ...item, payload: { ...item.payload } };
      resolve({ ok: false, item: lockItem });
    }
  });

const initialWorkerCount = 1;

const workerQueue = new WorkerQueue(
  {
    type: 'PET',
    handlers: [handler_ONE],
  },
  {
    workers: initialWorkerCount,
  }
);

// Set up a state
const queueItem_SAVE_ME = {
  clientMutationId: 'SAVE_ME',
  payload: { save: true, handledBy: [] },
  type: 'PET',
  errors: [],
  createdAt: new Date().toJSON(),
};

const testState: Store.All = {
  queue: [
    queueItem_SAVE_ME, // handler x1
  ],
  flags: [],
};

const testStore = createStore(
  combineReducers({ workerQueue: rootReducer }),
  { workerQueue: testState },
  applyMiddleware(workerQueue.middleware)
);

describe('FLUSH thunk action creators', () => {
  // Thunk action promise creators
  // Set up a store

  test('Test store set up went fine', () => {
    expect(testStore).toBeDefined();
    expect(testStore.getState).toBeDefined();
    const storeState = testStore.getState();
    expect(storeState).toBeDefined();
    expect(storeState.workerQueue.queue).toBeDefined();
    expect(storeState.workerQueue.flags).toBeDefined();
    expect(storeState.workerQueue.queue.length).toEqual(1);
    expect(storeState.workerQueue.flags.length).toEqual(0);
  });

  describe('flush()', () => {
    test('exists', () => {
      expect(flushDuck.flush()).toBeDefined();
    });

    test('it flushes a single queue item with handler with one worker', done => {
      testStore.dispatch(flushDuck.flush());

      function callback() {
        const flushedState = testStore.getState();
        expect(flushedState.workerQueue.queue.length).toBe(0);
        expect(
          find(flushedState.workerQueue.queue, {
            clientMutationId: queueItem_SAVE_ME.clientMutationId,
          })
        ).toBeUndefined();

        expect(flushedState.workerQueue.flags.length).toBe(0);

        expect(itemsProcessedInOrder.length).toBe(1);

        expect(itemHandlerOrder).toMatchObject({
          SAVE_ME: ['ONE'],
        });
        done();
      }

      setTimeout(() => {
        callback();
      }, 500);
    });
  });
});
