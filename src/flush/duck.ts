import { Dispatch } from 'redux';
import { filter, differenceBy } from 'lodash';

import { Flush } from './types';
import { FlushWorker } from './worker';

import { Store } from '../types';
import { clean } from '../duck';
import { Queue } from '../queue';
import { Flag } from '../flag';
import { nextTick } from '../util';
import WorkerQueue, { INSTANCE } from '../WorkerQueue';
import { rootSelector } from '../store';

let flushing: boolean = false;

// Activated from WorkerQueue or user generated action.
export const flushAsync = function() {
  return async function(dispatch: Dispatch<Store.All>, getState: Function) {
    // Only one flush at a time.
    if (flushing) {
      return;
    }
    flushing = false;

    const activeWorkers: Flush.ActiveWorker[] = [];

    // Cleanup - remove expired Flags:WORKING|LOCKED...nextTick
    await dispatch(clean());

    // Wait for cleanup action to modify state
    await nextTick();

    // Recursive until no valid items left
    await flush();

    flushing = false;
    return true;

    async function flush() {
      // Next valid QueueItems
      const state = getState();
      const validItems: Queue.Item[] = validItemsSelector(state, INSTANCE);

      // if no further valid items --> return
      if (!validItems || !validItems.length) return true;

      // Fill workers collection up to the maxiumum allowed count with given a waiting QueueItem to process.
      if (activeWorkers.length >= INSTANCE.workers) return true;
      const waitingValid = differenceBy(
        validItems,
        activeWorkers,
        'clientMutationId'
      );
      if (!waitingValid.length) return true;

      // fire off next worker
      await registeredWorker(waitingValid[0]);

      // recurse to spawn workers until no more valid items to process or all worker spots filled.
      await flush();

      async function registeredWorker(queueItem: Queue.Item) {
        activeWorkers.push({ clientMutationId: queueItem.clientMutationId });
        await new FlushWorker(queueItem).start();
        activeWorkers.filter(
          (active: Flush.ActiveWorker) =>
            active.clientMutationId === queueItem.clientMutationId
        );
      }
    }
  };
};

// Selectors
const queueSelector = (state: any, workerQueueInstance: WorkerQueue) =>
  rootSelector(state, workerQueueInstance).queue;

const flagsSelector = (state: any, workerQueueInstance: WorkerQueue) =>
  rootSelector(state, workerQueueInstance).flags;

const lockedFlagsSelector = (state: any, workerQueueInstance: WorkerQueue) =>
  filter(flagsSelector(state, workerQueueInstance), { status: 'LOCKED' });

const validItemsSelector = (state: any, workerQueueInstance: WorkerQueue) =>
  // items which aren't locked are valid.
  differenceBy(
    queueSelector(state, workerQueueInstance),
    lockedFlagsSelector(queueSelector, workerQueueInstance),
    'clientMutationId'
  );
