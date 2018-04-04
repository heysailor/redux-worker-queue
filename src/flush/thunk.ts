import { Dispatch } from 'redux';
import { filter, find } from 'lodash';
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
    // Only one flush at a time.
    if (flushing) {
      return;
    }
    flushing = true;
    dispatch(flagDuck.clean());

    const pullChain = async function(): Promise<boolean> {
      // Get the items in the queue that don't have bad flags
      const flushableItems = await getFlushableItems();
      if (!flushableItems.length) return true;

      // No async stuff between now and assigning a flushable to a worker
      // - otherwise the recursion means double assignment. That's why
      // the [synchronous] check to see if there's actually a spot free
      // happens after the more expensive item check.

      const openWorkerSpots = INSTANCE.workers - activeWorkers.length;
      if (!openWorkerSpots) return true;

      const assignedClientMutationIds = activeWorkers.map(reg => reg[1]);
      // console.log('activeWorkers', activeWorkers);

      const unAssignedItems = filter(
        flushableItems,
        item => assignedClientMutationIds.indexOf(item.clientMutationId) < 0
      );
      // console.log('unAssignedItems', unAssignedItems);

      const next = unAssignedItems.slice(0, openWorkerSpots);
      // console.log('next items', next);

      // Assign ASAP before firing promise, otherwise
      // recursion means another worker sneaks in. Tricky!
      next.map(item => {
        const workerId = shortid.generate();
        assignWorker(workerId, item.clientMutationId);
      });

      // Fire off a promise recursion chain
      await Promise.all(
        next.map(async item => {
          await flush(item);
          // Recurse. Wheeee!
          return await pullChain();
        })
      );
      return true;
    };

    await pullChain();

    async function flush(item: Queue.Item): Promise<boolean> {
      // console && console.log
      //   ? console.log(
      //       `${flushId}:${
      //         item.clientMutationId
      //       }|flushWorker fired at ${new Date().toJSON()}`
      //     )
      //   : null;

      // get workerId
      const reg = find(
        activeWorkers,
        (reg: string[]) => reg[1] === item.clientMutationId
      );

      const result = await flaggedWorker(item, reg ? reg[0] : 'ANON');

      // Remove worker registration
      unassignWorker(item.clientMutationId);

      // console && console.log
      //   ? console.log(
      //       `${reg ? reg[0] : 'ANON'}:${
      //         item.clientMutationId
      //       }|flushWorker finished at ${new Date().toJSON()}`
      //     )
      //   : null;

      return result;
    }

    function assignWorker(
      workerId: string,
      clientMutationId: ClientMutationId
    ) {
      activeWorkers.push([workerId, clientMutationId]);
    }

    function unassignWorker(clientMutationId: ClientMutationId) {
      // console.log('Unassigning', clientMutationId);
      // console.log('activeWorkers pre', activeWorkers);
      activeWorkers = filter(activeWorkers, reg => reg[1] !== clientMutationId);
      // console.log('activeWorkers post', activeWorkers);
    }

    async function getFlushableItems(): Promise<Queue.Item[]> {
      // Those not flagged as HALTED|WORKING, and not assigned a flush worker
      await nextTick();
      const state = getState();
      return flushDuck.flushableItemsSelector(state, INSTANCE);
    }

    async function flagAs(
      queueItem: Queue.Item,
      flagInput: Flag.NewItemInput | Flag.Item
    ): Promise<Flag.Item | undefined> {
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
      // We need its handlerIndex.
      const preWorkFlag = await getFlag(queueItem);

      // Another worker may flag as WORKING|LOCKED|HALTED while this flush was organised. Defer to the prior worker.
      if (preWorkFlag && preWorkFlag.status !== 'OK') {
        return true;
      }

      // flag as working
      const flag = await flagAs(queueItem, {
        ...preWorkFlag,
        status: 'WORKING',
      });
      //
      // console.log('flaggedWorker has set flag:', flag);

      // This really shouldn't happen. Safely log, and exit.
      if (!flag) {
        // if (console && console.error) {
        //   console.error(
        //     `Flag should be present for queue item ${
        //       queueItem.clientMutationId
        //     }`
        //   );
        // }
        return false;
      }
      // Is there another handler for this item, or is it done?
      if (!INSTANCE.getHandlersForType(queueItem.type)[flag.handlerIndex]) {
        await removeQueueItem(queueItem);
        return true;
      }

      const result = await new FlushWorker(queueItem, flag).process();

      // Making flag directly really just to obtain the new hash value.
      const testFlag: Flag.Item = new FlagItem(result.item, {
        status: 'WORKING',
      });
      const itemChanged = testFlag.hash !== flag.hash;

      await save(result.item);

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

      // console.log('flaggedWorker has set new flag:', newFlag);

      // console && console.log
      //   ? console.log(
      //       `[${flushId}:${
      //         result.item.clientMutationId
      //       }]flaggedWorker: Done, outcome flag is ${
      //         newFlag ? newFlag.status : null
      //       }`
      //     )
      //   : null;
      return true;
    }
  };
};
