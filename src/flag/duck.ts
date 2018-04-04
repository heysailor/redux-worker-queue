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
    const queue = queueSelector(state, INSTANCE);

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

    // Check that the HALTED flags should remain that way.
    const haltedFlags = haltedFlagsSelector(state, INSTANCE);

    if (haltedFlags.length) {
      await Promise.all(
        haltedFlags.map(flag => {
          return updateHaltedFlagAsync(
            flag,
            find(queue, { clientMutationId: flag.clientMutationId }),
            dispatch
          );
        })
      );
    }

    // Release any expired locks
    const lockedFlags = lockedFlagsSelector(state, INSTANCE);
    if (lockedFlags.length) {
      await Promise.all(
        lockedFlags.map(flag => {
          return updateLockedFlagAsync(
            flag,
            find(queue, { clientMutationId: flag.clientMutationId }),
            dispatch
          );
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

// Utils
async function updateHaltedFlagAsync(
  flag: Flag.Item,
  queueItem: Queue.Item | undefined,
  dispatch: Dispatch<Store.All>
) {
  // Shouldn't happen, but sanity check
  if (!queueItem) return;
  if (flag.status !== 'HALTED') return;

  const testFlag = new FlagItem(queueItem, flag);

  if (testFlag.hash === flag.hash) return;

  dispatch(addOrUpdateFlag(queueItem, { ...flag, status: 'OK' }));
  return nextTick();
}

async function updateLockedFlagAsync(
  flag: Flag.Item,
  queueItem: Queue.Item | undefined,
  dispatch: Dispatch<Store.All>
) {
  if (!queueItem) return;
  if (flag.status !== 'LOCKED') return;
  if (!flag.updatedAt) return;
  // console.log(
  //   'Difference between updatedAt and now',
  //   new Date().getTime() - new Date(flag.updatedAt).getTime()
  // );
  // console.log('Lockout period', INSTANCE.lockoutPeriod);
  // console.log(
  //   'Is less or equal to lockout?',
  //   new Date().getTime() - new Date(flag.updatedAt).getTime() <=
  //     INSTANCE.lockoutPeriod
  // );
  if (
    new Date().getTime() - new Date(flag.updatedAt).getTime() <=
    INSTANCE.lockoutPeriod
  )
    return;

  // console.log('Releasing lock for CMID', flag.clientMutationId);

  // Lock out has expired, release
  dispatch(addOrUpdateFlag(queueItem, { ...flag, status: 'OK' }));

  return nextTick();
}
