import 'jest';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { find } from 'lodash';

import rootReducer from '../duck';
import WorkerQueue from '../WorkerQueue';

import { Queue } from '../queue';

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

const handler_TWO = (item: Queue.Item): Promise<HandlerPromiseResponse> =>
  new Promise((resolve, reject) => {
    onHandlerCalled(item, 'TWO');
    const newItem: Queue.Item = {
      ...item,
      payload: {
        ...item.payload,
        handledBy: [...item.payload.handledBy, 'TWO'],
      },
    };

    resolve({ ok: true, item: newItem });
  });

const initialWorkerCount = 4;

const workerQueue = new WorkerQueue(
  {
    type: 'PET',
    handlers: [handler_ONE, handler_TWO],
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
const queueItem_HALT_ME = {
  clientMutationId: 'HALT_ME',
  payload: { halt: true, handledBy: [], deeply: { nested: 'stuff' } },
  type: 'PET',
  errors: [],
  createdAt: new Date().toJSON(),
};
const queueItem_LOCK_ME = {
  clientMutationId: 'LOCK_ME',
  payload: { lock: true, handledBy: [] },
  type: 'PET',
  errors: [],
  createdAt: new Date().toJSON(),
};
const queueItem_SAVE_ME_TOO = {
  clientMutationId: 'SAVE_ME_TOO',
  payload: { save: true, handledBy: [] },
  type: 'PET',
  errors: [],
  createdAt: new Date().toJSON(),
};
const queueItem_HEY_SAVE_ME_TOO = {
  clientMutationId: 'HEY_SAVE_ME_TOO',
  payload: { save: true, handledBy: [] },
  type: 'PET',
  errors: [],
  createdAt: new Date().toJSON(),
};

const testState: Store.All = {
  queue: [
    queueItem_SAVE_ME, // handler x2
    queueItem_HALT_ME, // handler x1 (immediate ok: false)
    queueItem_LOCK_ME, // handler x1
    queueItem_SAVE_ME_TOO, // handler x2
    queueItem_HEY_SAVE_ME_TOO, // handler x2
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
    expect(storeState.workerQueue.queue.length).toEqual(5);
    expect(storeState.workerQueue.flags.length).toEqual(0);
  });

  describe('flush()', () => {
    test('exists', () => {
      expect(flushDuck.flush()).toBeDefined();
    });

    test('it flushes the queue items with handlers in order, with the max allowed workers', done => {
      testStore.dispatch(flushDuck.flush());

      function callback() {
        const flushedState = testStore.getState();
        expect(flushedState.workerQueue.queue.length).toBe(2);
        expect(
          find(flushedState.workerQueue.queue, {
            clientMutationId: queueItem_HALT_ME.clientMutationId,
          })
        ).toBeTruthy();
        expect(
          find(flushedState.workerQueue.queue, {
            clientMutationId: queueItem_LOCK_ME.clientMutationId,
          })
        ).toBeTruthy();
        expect(flushedState.workerQueue.flags.length).toBe(2);

        const halted = find(flushedState.workerQueue.queue, {
          clientMutationId: queueItem_HALT_ME.clientMutationId,
        });
        expect(halted).toBeTruthy();
        expect(halted.payload.deeply.nested).toBe('stuff');
        expect(
          find(flushedState.workerQueue.flags, {
            clientMutationId: queueItem_HALT_ME.clientMutationId,
          })
        ).toMatchObject({
          status: 'HALTED',
        });

        expect(
          find(flushedState.workerQueue.flags, {
            clientMutationId: queueItem_LOCK_ME.clientMutationId,
          })
        ).toMatchObject({
          status: 'LOCKED',
        });
        // order very difficult to test, as workers on different threads[ish].
        expect(itemsProcessedInOrder.length).toBe(8);

        expect(itemHandlerOrder).toMatchObject({
          HALT_ME: ['ONE'],
          HEY_SAVE_ME_TOO: ['ONE', 'TWO'],
          LOCK_ME: ['ONE'],
          SAVE_ME: ['ONE', 'TWO'],
          SAVE_ME_TOO: ['ONE', 'TWO'],
        });
        done();
      }

      setTimeout(() => {
        callback();
      }, 50);
    });
  });
});
