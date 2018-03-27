import { createStore, applyMiddleware, combineReducers } from 'redux';
import { find } from 'lodash';
import rootReducer from '../duck';
import thunk from 'redux-thunk';
import WorkerQueue from '../WorkerQueue';
import { Queue } from '../queue';
import * as flagDuck from './duck';
import * as queueDuck from '../queue/duck';
// import { addOrUpdateItem } from '../queue/duck';
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
    expect(storeState.workerQueue.queue.length).toBeTruthy();
    expect(storeState.workerQueue.flags.length).toBeTruthy();
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

    test('it changes LOCKED flags for queueItems which have subsequently changed to OK', async () => {
      await cleanPromiseCreator(testStore.dispatch, testStore.getState);
      let firstState = testStore.getState();

      // confirm LOCKED flag is present and correct
      const lockFlag = firstState.workerQueue.flags[2];
      expect(lockFlag.clientMutationId).toEqual(
        queueItemLOCKED.clientMutationId
      );
      expect(lockFlag.status).toEqual('LOCKED');
      expect(lockFlag.hash).toEqual(lockFlag.lastHash);

      // change queueItem
      const stateQueueItemLocked = find(
        firstState.workerQueue.queue,
        item => item.clientMutationId === lockFlag.clientMutationId
      );
      const newPayload = { new: 'data' };
      testStore.dispatch(
        queueDuck.addOrUpdateItem({
          ...stateQueueItemLocked,
          payload: newPayload,
        })
      );

      // Check change has occured
      const secondState = testStore.getState();
      expect(
        find(
          secondState.workerQueue.queue,
          item =>
            item.clientMutationId === stateQueueItemLocked.clientMutationId
        ).payload
      ).toMatchObject(newPayload);

      // Now clean, and check flag has been removed.
      testStore.dispatch(flagDuck.clean());
      const thirdState = testStore.getState();

      const postItemChangeFlag = find(
        thirdState.workerQueue.flags,
        flag => flag.clientMutationId === lockFlag.clientMutationId
      );
      expect(postItemChangeFlag).toBeDefined();
      expect(postItemChangeFlag.status).toEqual('OK');
    });
  });
});
