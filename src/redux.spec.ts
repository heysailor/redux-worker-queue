import 'jest';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { find } from 'lodash';

// import rootReducer from '../duck';
import WorkerQueue from './WorkerQueue';
import { Queue } from './queue';
// import { FlagItem } from '../flag';

// import * as flagDuck from '../flag/duck';
// import * as flushDuck from './duck';
import { Store, HandlerPromiseResponse } from './types';
import './types';
import { worker } from 'cluster';

// Test use with an external redux store.

let handlersCalledFor: ClientMutationId[] = [];

const handler_ONE = (item: Queue.Item): Promise<HandlerPromiseResponse> =>
  new Promise((resolve, reject) => {
    handlersCalledFor.push(item.clientMutationId);
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
    handlersCalledFor.push(item.clientMutationId);
    const newItem: Queue.Item = {
      ...item,
      payload: {
        ...item.payload,
        handledBy: [...item.payload.handledBy, 'TWO'],
      },
    };

    resolve({ ok: true, item: newItem });
  });

// Initialise new queue
const initialWorkerCount = 4;
const workerQueue = new WorkerQueue(
  {
    type: 'PET',
    handlers: [handler_ONE, handler_TWO],
  },
  {
    workers: initialWorkerCount,
    // Use custom root as below
    reduxRootSelector: (state: any): Store.All => state.persistence,
  }
);

// Set up a sample state
const queueItem_SAVE_ME = {
  clientMutationId: 'SAVE_ME',
  payload: { save: true, handledBy: [] },
  type: 'PET',
  errors: [],
  createdAt: new Date().toJSON(),
};
const queueItem_ADD_ME_LATER = {
  clientMutationId: 'ADD_ME_LATER',
  payload: { save: true, handledBy: [] },
  type: 'PET',
};

const starterState: Store.All = {
  queue: [
    queueItem_SAVE_ME, // handler x2
  ],
  flags: [],
};

// Custom root key
const testStore = createStore(
  combineReducers({ persistence: workerQueue.reducers }),
  { persistence: starterState },
  applyMiddleware(workerQueue.middleware)
);

describe('WorkerQueue', () => {
  test('It exists as a class', () => {
    expect(WorkerQueue).toBeDefined();
    expect(workerQueue).toBeInstanceOf(WorkerQueue);
  });

  test('The test state initialised fine', () => {
    const state = testStore.getState();
    expect(state).toBeDefined();
    expect(state.persistence).toMatchObject(starterState);
  });

  describe('when initialised with external redux store', () => {
    test('it uses the reduxRootSelector setting to access the custom queue root key', () => {
      workerQueue.addOrUpdateQueueItem(queueItem_ADD_ME_LATER);
      const newState = testStore.getState();
      expect(
        find(newState.persistence.queue, { clientMutationId: 'ADD_ME_LATER' })
      ).toMatchObject({
        clientMutationId: 'ADD_ME_LATER',
      });
    });

    test('it flushes fine', done => {
      workerQueue.flush();

      setTimeout(() => {
        const newState = testStore.getState();
        expect(handlersCalledFor.length).toBe(4);
        expect(newState.persistence.queue.length).toBe(0);
        expect(newState.persistence.flags.length).toBe(0);
        done();
      }, 50);
    });
  });
});
