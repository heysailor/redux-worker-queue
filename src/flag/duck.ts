import { filter, find, differenceBy } from 'lodash';
import { Dispatch } from 'redux';

import { FlagItem } from './flag';
import { Flag } from './types';
import { Queue } from '../queue';
import { queueSelector } from '../queue/duck';
import { Action, Store } from '../types';
import { ActionTypes } from '../duck';
import { uniqueItems, rejectedItems, nextTick, orderedItems } from '../util';
import { rootSelector } from '../store';
import WorkerQueue, { INSTANCE } from '../WorkerQueue';

export enum FlagActionTypes {
  ADD_OR_UPDATE_FLAG = '__WORKER_QUEUE__ADD_OR_UPDATE_FLAG',
  REMOVE_FLAG = '__WORKER_QUEUE__REMOVE_FLAG',
}

// Flags represent queueItem meta.
// They need to be separate from the queueItem so that:
// - external handlers cannot alter the data
// - changing the meta does not change the queueItem, as that is how locking is determined.

// Actions

export function addOrUpdateFlag(
  queueItem: Queue.Item,
  flag: Flag.Item | Flag.NewItemInput
): Flag.AddOrUpdateFlagAction {
  if (!queueItem || !queueItem.clientMutationId || !queueItem.payload) {
    throw new Error('Must provide a queueItem as first argument');
  }
  if (!flag || !flag.status) {
    throw new Error(
      'Must provide a flag with status property as second argument'
    );
  }

  return {
    type: FlagActionTypes.ADD_OR_UPDATE_FLAG,
    flag: new FlagItem(queueItem, flag),
  };
}

export function removeFlag(
  clientMutationId: ClientMutationId
): Flag.RemoveFlagAction {
  if (!clientMutationId) {
    throw new Error('Must provide the relevant QueueItem.clientMutationId');
  }

  return {
    type: FlagActionTypes.REMOVE_FLAG,
    clientMutationId,
  };
}

// Activated from WorkerQueue or user generated action.
export const clean = function() {
  return async function cleanAsync(
    dispatch: Dispatch<Store.All>,
    getState: Function
  ) {
    let state = getState();

    // Get flags which reference queue items which no longer exist.
    const irrelevant = differenceBy(
      flagsSelector(state, INSTANCE),
      queueSelector(state, INSTANCE),
      'clientMutationId'
    );

    if (irrelevant.length) {
      // Remove all
      await Promise.all(
        irrelevant.map(flag => {
          dispatch(removeFlag(flag.clientMutationId));
          return nextTick();
        })
      );

      // Fetch changed state
      state = getState();
    }

    // Check that the locked out flags should remain that way.
    const lockedFlags = lockedFlagsSelector(state, INSTANCE);
    const queue = queueSelector(state, INSTANCE);

    if (lockedFlags.length) {
      await Promise.all(
        lockedFlags.map(flag => {
          const queueItem = find(queue, {
            clientMutationId: flag.clientMutationId,
          });
          // Shouldn't happen, but sanity check
          if (!queueItem) return;
          const testFlag = new FlagItem(queueItem, flag);
          console.log('CLEAN testflag', testFlag);

          if (testFlag.hash !== flag.hash) {
            // queueItem has changed, therefore out of purgatory
            dispatch(addOrUpdateFlag(queueItem, { status: 'OK' }));
            return nextTick();
          } else {
            // Still in the bad books, don't change status
            return;
          }
        })
      );
    }

    // Doneskis.
    return true;
  };
};

// Reducer

export default function flagsReducer(
  state: Flag.Store = [],
  action: Action
): Flag.Store {
  switch (action.type) {
    case FlagActionTypes.ADD_OR_UPDATE_FLAG: {
      return uniqueItems(orderedItems([action.flag, ...state]));
    }
    case FlagActionTypes.REMOVE_FLAG: {
      return rejectedItems(state, action.clientMutationId);
    }
    case ActionTypes.__CLEAR__: {
      return [];
    }
    default: {
      return state;
    }
  }
}

// Selectors

export const flagsSelector = (state: any, workerQueueInstance: WorkerQueue) => {
  return workerQueueInstance.rootSelector(state).flags;
};

export const flagByClientMutationIdSelector = (
  state: any,
  workerQueueInstance: WorkerQueue,
  clientMutationId: ClientMutationId
) => find(flagsSelector(state, workerQueueInstance), { clientMutationId });

export const lockedFlagsSelector = (
  state: any,
  workerQueueInstance: WorkerQueue
) => filter(flagsSelector(state, workerQueueInstance), { status: 'LOCKED' });

export const workingFlagsSelector = (
  state: any,
  workerQueueInstance: WorkerQueue
) => filter(flagsSelector(state, workerQueueInstance), { status: 'WORKING' });

export const haltedFlagsSelector = (
  state: any,
  workerQueueInstance: WorkerQueue
) => filter(flagsSelector(state, workerQueueInstance), { status: 'HALTED' });

export const okFlagsSelector = (state: any, workerQueueInstance: WorkerQueue) =>
  filter(flagsSelector(state, workerQueueInstance), { status: 'OK' });
