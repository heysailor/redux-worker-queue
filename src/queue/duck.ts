import { find } from 'lodash';
import { Dispatch } from 'redux';
import { QueueItem } from './item';
import { Queue } from './types';
import { Action, Store } from '../types';
import { ActionTypes } from '../duck';
import WorkerQueue, { INSTANCE } from '../WorkerQueue';
import { rootSelector } from '../store';
import { orderedItems, uniqueItems, rejectedItems, nextTick } from '../util';

export enum QueueActionTypes {
  ADD_OR_UPDATE_ITEM = '__QUEUE__ADD_OR_UPDATE_ITEM',
  REMOVE_ITEM = '__QUEUE__REMOVE_ITEM',
}

// Add or update queue item. Entry to using queue.
export function addOrUpdateItem(
  queueItem: Queue.Item | Queue.NewItemInput
): Queue.AddOrUpdateItemAction {
  return {
    type: QueueActionTypes.ADD_OR_UPDATE_ITEM,
    item: new QueueItem(queueItem),
  };
}

// Remove queue item
export const removeItem = (
  clientMutationId: ClientMutationId
): Queue.RemoveItemAction => {
  return {
    type: QueueActionTypes.REMOVE_ITEM,
    clientMutationId,
  };
};

// Reducer
export default function queueReducer(
  state: Queue.Store = [],
  action: Action
): Queue.Store {
  switch (action.type) {
    case QueueActionTypes.ADD_OR_UPDATE_ITEM: {
      return orderedItems(uniqueItems([action.item, ...state]));
    }
    case QueueActionTypes.REMOVE_ITEM: {
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

export const queueSelector = (state: any, workerQueueInstance: WorkerQueue) =>
  rootSelector(state, workerQueueInstance).queue;

export const queueItemByClientMutationIdSelector = (
  state: any,
  clientMutationId: ClientMutationId
) => find(queueSelector(state, INSTANCE), { clientMutationId });
