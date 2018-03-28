import 'jest';
import mockConsole from 'jest-mock-console';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { find } from 'lodash';

// import rootReducer from '../duck';
import WorkerQueue from '../WorkerQueue';
import { Queue } from '../queue';
import { Flag, FlagItem } from '../flag';

// import * as flagDuck from '../flag/duck';
// import * as flushDuck from './duck';
import { Store, HandlerPromiseResponse } from '../types';
import './types';
import { worker } from 'cluster';

// Test use with an external redux store,
// need state as FlushWorker depends on a worker queue instance with regsitered handlers

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

const HANDLER_ERROR_MESSAGE =
  'I fucked up, handlers should always resolve to the standard response object.';
const handler_WITH_CODING_ERROR = (
  item: Queue.Item
): Promise<HandlerPromiseResponse> =>
  new Promise((resolve, reject) => {
    reject(HANDLER_ERROR_MESSAGE);
  });

// Initialise new queue
const initialWorkerCount = 4;
const workerQueue = new WorkerQueue(
  {
    type: 'PET',
    handlers: [handler_ONE, handler_WITH_CODING_ERROR],
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
const okFlag: Flag.Item = new FlagItem(queueItem_SAVE_ME, {
  status: 'OK',
});
const queueItem_UNREGISTERED = {
  clientMutationId: 'SAVE_ME',
  payload: { save: true, handledBy: [] },
  type: 'ZOMBIE',
  errors: [],
  createdAt: new Date().toJSON(),
};
const zombieFlag: Flag.Item = new FlagItem(queueItem_SAVE_ME, {
  status: 'OK', // should never be flagged as OK if unreg, but for testing
});
// const queueItem_ADD_ME_LATER = {
//   clientMutationId: 'ADD_ME_LATER',
//   payload: { save: true, handledBy: [] },
//   type: 'PET',
// };

const starterState: Store.All = {
  queue: [],
  flags: [],
};

// Custom root key
const testStore = createStore(
  combineReducers({ persistence: workerQueue.reducers }),
  { persistence: starterState },
  applyMiddleware(workerQueue.middleware)
);

import { FlushWorker } from './worker';

describe('Worker', () => {
  const worker = new FlushWorker(queueItem_SAVE_ME, okFlag);
  test('exists as a class', () => {
    expect(worker).toBeInstanceOf(FlushWorker);
  });

  describe('process()', () => {
    test('it demands the queue item type be registered', async () => {
      expect.assertions(1);
      const zombieWorker = new FlushWorker(queueItem_UNREGISTERED, zombieFlag);

      return expect(zombieWorker.process()).rejects.toMatchObject(
        new Error(
          'Must register at least one handler for ZOMBIE type of queue item.'
        )
      );
    });
    test('if the flag calls for a handlerIndex beyond the number registered, it returns ok: true', async () => {
      expect.assertions(1);
      const handlerBeyondFlag = new FlagItem(queueItem_SAVE_ME, {
        status: 'OK',
        handlerIndex: 3,
      });
      const worker = new FlushWorker(queueItem_SAVE_ME, handlerBeyondFlag);

      return expect(worker.process()).resolves.toMatchObject({
        ok: true,
        item: queueItem_SAVE_ME,
      });
    });
    test('if the handler has a coding snafu and returns an error, it console.error()s a helpful message and resolves ok: false.', async done => {
      expect.assertions(2);
      mockConsole();

      const ERROR_MESSAGE = `Your handler for queued item with clientMutationId ${
        queueItem_SAVE_ME.clientMutationId
      } of type ${
        queueItem_SAVE_ME.type
      } returned an error, which is bad. Handlers should _always_ return { ok: boolean, item: QueueItem }. Place any errors in QueueItem.errors. The error was '${HANDLER_ERROR_MESSAGE}'`;

      const triggerHandlerWithErrorFlag = new FlagItem(queueItem_SAVE_ME, {
        status: 'OK',
        handlerIndex: 1,
      });
      const worker = new FlushWorker(
        queueItem_SAVE_ME,
        triggerHandlerWithErrorFlag
      );

      expect(worker.process()).resolves.toMatchObject({
        ok: false,
        item: queueItem_SAVE_ME,
      });
      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(ERROR_MESSAGE);
        done();
      }, 10);
    });
  });
});
