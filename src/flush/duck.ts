import { Dispatch } from 'redux';
import { filter, differenceBy, uniqBy, find } from 'lodash';

import { Flush } from './types';

import { Store } from '../types';
import { Queue } from '../queue';
import { queueSelector } from '../queue/duck';
import { Flag, FlagItem } from '../flag';
import {
  addOrUpdateFlag,
  flagByClientMutationIdSelector,
  haltedFlagsSelector,
  lockedFlagsSelector,
  workingFlagsSelector,
  flagsSelector,
  removeFlag,
  clean,
} from '../flag/duck';
import { nextTick } from '../util';
import WorkerQueue, { INSTANCE } from '../WorkerQueue';
import { rootSelector } from '../store';
import { FlushWorker } from './worker';

let flushing: boolean = false;

// Activated from WorkerQueue or user generated action.
export const flushAsync = function() {
  return async function(dispatch: Dispatch<Store.All>, getState: Function) {
    // Only one flush at a time.
    if (flushing) {
      return;
    }
    flushing = false;

    // Cleanup - remove expired Flags:WORKING|LOCKED...nextTick
    await dispatch(clean());

    // Recursive until no valid items left
    await flush();

    flushing = false;
    return true;

    async function flush() {
      // Next valid QueueItems
      const state = getState();

      // Spawn worker with waiting QueueItem to process up to the maxiumum allowed count.
      // First, as the flags queue will likely be shorter than the item queue.
      const workingFlags = workingFlagsSelector(state, INSTANCE);
      if (workingFlags.length >= INSTANCE.workers) return true;

      // Those not flagged as HALTED|WORKING
      const flushableItems: Queue.Item[] = flushableItemsSelector(
        state,
        INSTANCE
      );
      if (!flushableItems || !flushableItems.length) return true;

      // fire off next worker
      await flaggedWorker(flushableItems[0]);

      // recurse to spawn workers until no more valid items to process or all worker spots filled.
      await flush();

      async function flaggedWorker(queueItem: Queue.Item) {
        // flag as working
        dispatch(addOrUpdateFlag(queueItem, { status: 'WORKING' }));

        // wait for flag to be present
        await nextTick();

        // get flag
        const state = getState();
        const flag = flagByClientMutationIdSelector(
          state,
          INSTANCE,
          queueItem.clientMutationId
        );

        // This really shouldn't happen.
        if (!flag) {
          throw new Error(
            `Flag should be present for queue item ${
              queueItem.clientMutationId
            }`
          );
        }

        const result = await new FlushWorker(queueItem, flag).process();

        // Make intermediate test flag to obtain new item hash
        const testFlag = new FlagItem(result.item, flag);
        const itemChanged = testFlag.hash === flag.hash;
        let newFlag;

        if (!result.ok && itemChanged) {
          // OK: false, item changed: The handler needs to halt the item so more work is done
          newFlag = new FlagItem(result.item, { ...flag, status: 'HALTED' });
        } else if (result.ok && !itemChanged) {
          // OK: true, item not changed: There was an error
          newFlag = new FlagItem(result.item, { ...flag, status: 'LOCKED' });
        } else {
          // Happy days. Item marked OK, increment to next handler.
          newFlag = new FlagItem(result.item, {
            ...flag,
            status: 'OK',
            handlerIndex: flag.handlerIndex + 1,
          });
        }
        dispatch(addOrUpdateFlag(result.item, newFlag));
        await nextTick();
        return true;
      }
    }
  };
};

// Selectors

export function flushableItemsSelector(state: any, INSTANCE: WorkerQueue) {
  const badFlags = uniqBy(
    [
      ...haltedFlagsSelector(state, INSTANCE),
      ...lockedFlagsSelector(state, INSTANCE),
      ...workingFlagsSelector(state, INSTANCE),
    ],
    'clientMutationId'
  );
  return differenceBy(
    queueSelector(state, INSTANCE),
    badFlags,
    'clientMutationId'
  );
}
