import { Dispatch } from 'redux';
import { remove, filter } from 'lodash';
import shortid from 'shortid';
import { Queue } from '../queue';
import { FlagItem, Flag } from '../flag';
import { nextTick } from '../util';
import { FlushWorker } from './worker';
import { INSTANCE } from '../WorkerQueue';

import { Store } from '../types';

import * as flushDuck from './duck';
import * as flagDuck from '../flag/duck';
import { removeItem, addOrUpdateItem } from '../queue/duck';
import { isFunction } from 'util';

let flushing: boolean = false;
let activeWorkers: [string, ClientMutationId][] = [];

// Activated from WorkerQueue or user generated action.
export const flush = function() {
  return async function flushAsync(
    dispatch: Dispatch<Store.All>,
    getState: Function
  ) {
    console.log('FLUSHING TRIGGERED', flushing, shortid.generate());
    // Only one flush at a time.
    if (flushing) {
      return;
    }
    flushing = true;
    await clean();

    const pullChain = async function(): Promise<boolean> {
      const flushableItems = await getFlushableItems();

      console.log(
        `PULL CHAIN: These items are ready to go: ${flushableItems.map(
          item => `${item.clientMutationId}`
        )}`
      );

      if (!flushableItems.length) return true;

      const openWorkerSpots = INSTANCE.workers - activeWorkers.length;

      if (!openWorkerSpots) return true;

      console.log(`PULL CHAIN: We can launch ${openWorkerSpots} workers`);

      const next = flushableItems.slice(0, openWorkerSpots);

      await Promise.race(
        next.map(async item => {
          await flush(item);
          // Recurse. Wheeee!
        })
      );
      return pullChain();
    };

    await pullChain();

    async function flush(item: Queue.Item): Promise<boolean> {
      const flushId = shortid.generate();
      activeWorkers.push([flushId, item.clientMutationId]);
      console.log(
        `PULL CHAIN|FLUSH:${flushId} fired at ${new Date().toJSON()}`
      );
      console.log(activeWorkers);

      const result = await flaggedWorker(item, flushId);

      console.log(
        `PULL CHAIN|FLUSH:${flushId} finished at ${new Date().toJSON()}`
      );
      activeWorkers = remove(activeWorkers, reg => reg[0] === flushId);

      return result;
    }

    async function getFlushableItems(): Promise<Queue.Item[]> {
      const state = getState();
      // Those not flagged as HALTED|WORKING, and not assigned a flush worker
      await nextTick();
      const readyInState = flushDuck.flushableItemsSelector(state, INSTANCE);
      console.log(
        'Ready in state',
        readyInState.map(ready => ready.clientMutationId)
      );
      console.log('activeWorkers', activeWorkers);

      const assignedClientMutationIds = activeWorkers.map(reg => reg[1]);
      console.log('assignedClientMutationIds', assignedClientMutationIds);
      const filtered = filter(
        readyInState,
        queueItem =>
          assignedClientMutationIds.indexOf(queueItem.clientMutationId) < 0
      );
      console.log('filtered', filtered.map(ready => ready.clientMutationId));
      return filtered;
    }

    function clean() {
      dispatch(flagDuck.clean());
      // await nextTick();
    }

    async function flagAs(
      queueItem: Queue.Item,
      flagInput: Flag.NewItemInput | Flag.Item
    ): Promise<Flag.Item | undefined> {
      console.log('FLAGGING AS', queueItem.clientMutationId, flagInput.status);
      dispatch(flagDuck.addOrUpdateFlag(queueItem, flagInput));
      await nextTick();
      // get flag
      const newFlag = await getFlag(queueItem);

      if (!newFlag) throw new Error('Could not flag queueItem');
      return newFlag;
    }

    async function getFlag(
      queueItem: Queue.Item
    ): Promise<Flag.Item | undefined> {
      await nextTick();
      return flagDuck.flagByClientMutationIdSelector(
        getState(),
        INSTANCE,
        queueItem.clientMutationId
      );
    }

    function removeQueueItem(queueItem: Queue.Item) {
      dispatch(removeItem(queueItem.clientMutationId));
      dispatch(flagDuck.removeFlag(queueItem.clientMutationId));
      // await nextTick();
    }

    function save(queueItem: Queue.Item) {
      dispatch(addOrUpdateItem(queueItem));
      // await nextTick();
    }

    async function flaggedWorker(
      queueItem: Queue.Item,
      flushId: string
    ): Promise<boolean> {
      // console.log(
      //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: triggered for queueItem`,
      //   queueItem
      // );

      // console.log(
      //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: adding WORKING flag for CMID ${
      //     queueItem.clientMutationId
      //   }`
      // );

      // We need its handlerIndex.
      const preWorkFlag = await getFlag(queueItem);
      console.log(
        'Flag for item:',
        queueItem.clientMutationId,
        preWorkFlag ? preWorkFlag.status : null
      );

      // Another worker may flag as WORKING|LOCKED|HALTED while this flush was organised. Defer to the prior worker.
      if (preWorkFlag && preWorkFlag.status !== 'OK') {
        return true;
      }

      // flag as working
      const flag = await flagAs(queueItem, {
        ...preWorkFlag,
        status: 'WORKING',
      });

      // console.log(
      //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: flag for CMID ${
      //     queueItem.clientMutationId
      //   } is`,
      //   flag
      // );
      // This really shouldn't happen. Safely log, and exit.
      if (!flag) {
        if (console && console.error) {
          console.error(
            `Flag should be present for queue item ${
              queueItem.clientMutationId
            }`
          );
        }
        return false;
      }
      // Is there another handler for this item, or is it done?
      if (!INSTANCE.getHandlersForType(queueItem.type)[flag.handlerIndex]) {
        // console.log(
        //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: goodbye pork pie, CMID ${
        //     queueItem.clientMutationId
        //   }`
        // );
        await removeQueueItem(queueItem);
        console.log(
          `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: doneskis on ${
            queueItem.clientMutationId
          }`,
          queueItem.payload.handledBy
        );
        return true;
      }
      // console.log(
      //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: spawing new FlushWorker`
      // );
      const result = await new FlushWorker(queueItem, flag).process();
      // console.log(
      //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker|FlushWorker: result`,
      //   result
      // );
      // Making flag directly really just to obtain the new hash value.
      const testFlag: Flag.Item = new FlagItem(result.item, {
        status: 'WORKING',
      });
      const itemChanged = testFlag.hash !== flag.hash;
      // console.log(
      //   `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: itemChanged ${itemChanged}`
      // );
      let newFlag;
      if (!result.ok && itemChanged) {
        // OK: false, item changed: The handler needs to halt the item so more work is done
        newFlag = await flagAs(result.item, { ...flag, status: 'HALTED' });
      } else if (!result.ok && !itemChanged) {
        // OK: false, item not changed: There was a coding error/the handler didn't catch an error; prevent endless loop.
        newFlag = await flagAs(result.item, { ...flag, status: 'LOCKED' });
      } else {
        // Happy days. Item marked OK, doesn't matter if changed. Increment to next handler.
        newFlag = await flagAs(result.item, {
          ...flag,
          status: 'OK',
          handlerIndex: flag.handlerIndex + 1,
        });
      }

      // console.log(`PULL CHAIN|FLUSH:${flushId}|flaggedWorker: saving item`);
      await save(result.item);

      console.log(
        `PULL CHAIN|FLUSH:${flushId}|flaggedWorker: Done, outcome flag is`,
        newFlag,
        result.item.payload.handledBy
      );
      return true;
    }
  };
};
