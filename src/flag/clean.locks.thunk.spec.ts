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
  combineReducers({ workerQueue: workerQueue.reducers }),
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

  describe('clean LOCK flags', () => {
    test('should leave LOCK flags which have not been updated', async () => {
      const firstState = testStore.getState();
      const lockFlag = find(firstState.workerQueue.flags, {
        clientMutationId: queueItemLOCKED.clientMutationId,
      });
      testStore.dispatch(flagDuck.clean());
      await nextTick();
      const postCleanState = testStore.getState();
      expect(
        find(postCleanState.workerQueue.flags, {
          clientMutationId: queueItemLOCKED.clientMutationId,
        })
      ).toBeDefined();
    });

    describe('When assessing updated LOCK flags', () => {
      const queueItemLOCKED = {
        clientMutationId: 3,
        payload: {},
        type: 'PET',
        errors: [],
        createdAt: new Date().toJSON(),
      };

      // Make a lock flag with an updatedAt field, added when createdAt of first iteration found
      let lockFlag = new FlagItem(queueItemLOCKED, { status: 'LOCKED' });
      lockFlag = new FlagItem(queueItemLOCKED, {
        ...lockFlag,
        status: 'LOCKED',
      });
      const testState: Store.All = {
        queue: [queueItemLOCKED],
        flags: [
          new FlagItem(
            queueItemLOCKED,
            new FlagItem(queueItemLOCKED, { status: 'LOCKED' })
          ),
        ],
      };
      const updatedLocksTestStore = createStore(
        combineReducers({ workerQueue: workerQueue.reducers }),
        { workerQueue: testState },
        applyMiddleware(workerQueue.middleware)
      );

      test('it should leave those whose time since update is less than the WorkerQueue lockoutPeriod', async () => {
        const firstState = updatedLocksTestStore.getState();
        const lockFlagInState = find(firstState.workerQueue.flags, {
          clientMutationId: queueItemLOCKED.clientMutationId,
        });
        expect(lockFlagInState).toBeDefined();
        expect(lockFlagInState.updatedAt).toBeDefined();
        testStore.dispatch(flagDuck.clean());
        await nextTick();
        const postCleanState = updatedLocksTestStore.getState();
        expect(
          find(postCleanState.workerQueue.flags, {
            clientMutationId: queueItemLOCKED.clientMutationId,
          })
        ).toBeDefined();
      });

      test('it should change the status to OK for those whose time since update is more than the WorkerQueue lockoutPeriod', async done => {
        expect.assertions(3);

        workerQueue.lockoutPeriod = 1000;
        expect(workerQueue.lockoutPeriod).toEqual(1000);

        setTimeout(() => {
          updatedLocksTestStore.dispatch(flagDuck.clean());
          const postCleanState = updatedLocksTestStore.getState();
          const shouldBeUnlockedFlag = find(postCleanState.workerQueue.flags, {
            clientMutationId: queueItemLOCKED.clientMutationId,
          });
          expect(shouldBeUnlockedFlag).toBeDefined();
          expect(shouldBeUnlockedFlag.status).toEqual('OK');
          done();
        }, 1001);
      });
    });
  });
});
