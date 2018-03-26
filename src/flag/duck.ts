import { filter } from 'lodash';

import { FlagItem } from './flag';
import { Flag } from './types';
import { Queue } from '../queue';
import { Action, Store } from '../types';
import { ActionTypes } from '../duck';
import { uniqueItems, rejectedItems } from '../util';
import { rootSelector } from '../store';
import { WorkerQueue } from '../main';
export enum FlagActionTypes {
  ADD_OR_UPDATE_FLAG = '__WORKER_QUEUE__ADD_OR_UPDATE_FLAG',
  REMOVE_FLAG = '__WORKER_QUEUE__REMOVE_FLAG',
}

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

// Reducer

export default function flag(
  state: Flag.Store = [],
  action: Action
): Flag.Store {
  switch (action.type) {
    case FlagActionTypes.ADD_OR_UPDATE_FLAG: {
      return uniqueItems([action.flag, ...state]);
    }
    case FlagActionTypes.REMOVE_FLAG: {
      return rejectedItems(state, action.clientMutationId);
    }
    case ActionTypes.__CLEAR__: {
      return [];
    }
  }
  return [];
}
