import { createStore, applyMiddleware, combineReducers } from 'redux';
import { find } from 'lodash';
import rootReducer from '../duck';
import thunk from 'redux-thunk';
import WorkerQueue from '../WorkerQueue';
import { Queue } from '../queue';
import * as flagDuck from './duck';
import * as queueDuck from '../queue/duck';
import { HandlerPromiseResponse } from '../types';
import { FlagItem } from './flag';
import { Store } from '../types';
import { nextTick } from '../util';
import 'jest';

// These tests use an "external" redux store to help in testing.

const initialWorkerCount = 2;
const handler = (item: Queue.Item): Promise<HandlerPromiseResponse> =>
  new Promise((resolve, reject) => resolve({ ok: true, item }));

const workerQueue = new WorkerQueue(
  {
    type: 'PETS',
    handlers: [handler],
  },
  {
    workers: initialWorkerCount,
  }
);

// Set up a state
const queueItemWORKING = {
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
const queueItemLOCKED = {
  clientMutationId: 3,
  payload: {},
  type: 'PET',
  errors: [],
  createdAt: new Date().toJSON(),
};
const queueItemHALTED = {
  clientMutationId: 4,
  payload: {},
  type: 'PET',
  errors: [],
  createdAt: new Date().toJSON(),
};

const testState: Store.All = {
  queue: [queueItemWORKING, queueItemOK, queueItemLOCKED, queueItemHALTED],
  flags: [
    new FlagItem(queueItemWORKING, { status: 'WORKING' }),
    new FlagItem(queueItemOK, { status: 'OK' }),
    // Make flag item with identical hash, lastHash
    new FlagItem(
      queueItemLOCKED,
      new FlagItem(queueItemLOCKED, { status: 'LOCKED' })
    ),
    new FlagItem(queueItemHALTED, { status: 'HALTED' }),
  ],
};

const testStore = createStore(
  combineReducers({ workerQueue: rootReducer }),
  { workerQueue: testState },
  applyMiddleware(workerQueue.middleware)
);

describe('Flag thunk action creators', () => {
  // Set up a store

  test('Test store set up went fine', () => {
    expect(testStore).toBeDefined();
    expect(testStore.getState).toBeDefined();
    const storeState = testStore.getState();
    expect(storeState).toBeDefined();
    expect(storeState.workerQueue.queue).toBeDefined();
    expect(storeState.workerQueue.flags).toBeDefined();
    expect(storeState.workerQueue.queue.length).toBe(4);
    expect(storeState.workerQueue.flags.length).toBe(4);
  });

  describe('clean()', () => {
    test('exists', () => {
      expect(flagDuck.clean()).toBeDefined();
    });

    const cleanPromiseCreator = flagDuck.clean();
    const cleanPromise: Promise<boolean> = cleanPromiseCreator(
      testStore.dispatch,
      testStore.getState
    );

    test('it is a thunk action creator', async () => {
      // Thunk creators return a function....
      expect(cleanPromiseCreator).toBeInstanceOf(Function);

      // ...which return a Promise
      expect(cleanPromise).toBeInstanceOf(Promise);
    });

    test('its promise resolves to a boolean, which is true', async () => {
      expect.assertions(1);
      const result = await cleanPromiseCreator(
        testStore.dispatch,
        testStore.getState
      );
      expect(result).toEqual(true);
    });

    test('it removes flags which reference non existent queueItems', async () => {
      expect.assertions(2);

      testStore.dispatch(
        queueDuck.addOrUpdateItem({ payload: {}, type: 'PETS' })
      );
      await nextTick();
      const state = testStore.getState();
      expect(state.workerQueue.queue).toBeDefined();
      // New item is the last
      const newItem =
        state.workerQueue.queue[state.workerQueue.queue.length - 1];
      // Make a flag for it
      testStore.dispatch(
        flagDuck.addOrUpdateFlag(newItem, { status: 'WORKING' })
      );

      // Now get rid of it from the queue
      testStore.dispatch(queueDuck.removeItem(newItem.clientMutationId));
      // Settle state
      await nextTick();

      const result = await cleanPromiseCreator(
        testStore.dispatch,
        testStore.getState
      );
      expect(result).toEqual(true);
    });

    test('it changes HALTED flags, for queueItems which have changed, to OK', async () => {
      const haltCleanTestStore = createStore(
        combineReducers({ workerQueue: rootReducer }),
        { workerQueue: testState },
        applyMiddleware(workerQueue.middleware)
      );
      const initialHaltTestState = haltCleanTestStore.getState();

      // confirm HALTED flag is present and correct
      const haltedFlag = find(initialHaltTestState.workerQueue.flags, {
        status: 'HALTED',
      });
      expect(haltedFlag.clientMutationId).toEqual(
        queueItemHALTED.clientMutationId
      );
      expect(haltedFlag.status).toEqual('HALTED');
      expect(haltedFlag.hash).toBeTruthy();
      expect(haltedFlag.hash).not.toEqual(haltedFlag.lastHash);

      // Great, try a clean
      await haltCleanTestStore.dispatch(flagDuck.clean());
      const cleanedState = haltCleanTestStore.getState();

      // Halt should remain
      const haltedFlagRemaining = find(cleanedState.workerQueue.flags, {
        status: 'HALTED',
      });
      expect(haltedFlagRemaining).toBeTruthy();
      expect(haltedFlagRemaining.clientMutationId).toEqual(
        haltedFlag.clientMutationId
      );

      // change queueItem
      const haltedQueueItemInState = find(
        cleanedState.workerQueue.queue,
        item => item.clientMutationId === haltedFlag.clientMutationId
      );
      const newPayload = { new: 'data' };
      haltCleanTestStore.dispatch(
        queueDuck.addOrUpdateItem({
          ...haltedQueueItemInState,
          payload: newPayload,
        })
      );

      // Check change has occured
      const changedQueueItemState = haltCleanTestStore.getState();
      const changedQueueItemInState = find(
        changedQueueItemState.workerQueue.queue,
        item =>
          item.clientMutationId === haltedQueueItemInState.clientMutationId
      );
      expect(changedQueueItemInState.payload).toMatchObject(newPayload);
      expect(haltedQueueItemInState.payload).not.toMatchObject(
        changedQueueItemInState.payload
      );

      // Now clean, and check HALTED flag has been changed to OK.
      haltCleanTestStore.dispatch(flagDuck.clean());
      const changedQueueItemAndCleanedState = haltCleanTestStore.getState();

      const postItemChangeFlag = find(
        changedQueueItemAndCleanedState.workerQueue.flags,
        flag => flag.clientMutationId === haltedFlag.clientMutationId
      );
      expect(postItemChangeFlag).toBeDefined();
      expect(postItemChangeFlag.status).toEqual('OK');
    });
  });
});
