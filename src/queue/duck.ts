import { combineReducers, Store, Reducer, AnyAction } from 'redux';
import { orderBy } from 'lodash';
import {
  QueueItem,
  INewQueueItem,
  IQueueItem,
  ClientMutationId,
} from '../item';
import { INSTANCE } from './Queue';
import { IRootState } from '../store';
import { ActionTypes } from '../actionTypes';

export interface IQueueState {
  queue: IQueueItem[];
}

// See this for a explanation of this approach, including use of 'OTHER'
// https://spin.atomicobject.com/2017/07/24/redux-action-pattern-typescript/
export enum ActionTypeKeys {
  ADD_OR_UPDATE_ITEM = '__QUEUE__ADD_OR_UPDATE_ITEM',
  REMOVE_ITEM = '__QUEUE__REMOVE_ITEM',

  SET_ITEM_VALIDATION = '__QUEUE__SET_ITEM_VALIDATION',
  SET_ITEM_ELIGIBILITY = '__QUEUE__SET_ITEM_ELIGIBILITY',
  SET_ITEM_HASH = '__QUEUE__SET_ITEM_HASH',
  SET_ITEM_SAVING = '__QUEUE__SET_ITEM_SAVING',

  CLEANUP = '__QUEUE__CLEANUP',
  REMOVE_ITEM_HASH = '__QUEUE__REMOVE_ITEM_HASH',

  __CLEAR__ = '__QUEUE__CLEAR',

  OTHER = '__any_other_action__',
}

// Add or update queue item

export interface IAddOrUpdateItemAction {
  type: ActionTypeKeys.ADD_OR_UPDATE_ITEM;
  item: IQueueItem;
}

export function addOrUpdateItem(
  queueItem: INewQueueItem | IQueueItem
): IAddOrUpdateItemAction {
  return {
    type: ActionTypeKeys.ADD_OR_UPDATE_ITEM,
    item: new QueueItem(queueItem),
  };
}

// Remove queue item

export interface IRemoveItemAction {
  type: ActionTypeKeys.REMOVE_ITEM;
  clientMutationId: ClientMutationId;
}
export function removeItem(
  clientMutationId: ClientMutationId
): IRemoveItemAction {
  return { type: ActionTypeKeys.REMOVE_ITEM, clientMutationId };
}

// Wipe queue  ## DANGER ZONE ##

export interface I__clearQueue__Action {
  type: ActionTypeKeys.__CLEAR__;
}

export function __clearQueue__(): I__clearQueue__Action {
  return { type: ActionTypeKeys.__CLEAR__ };
}

// Clean up completed items

export interface ICleanupAction {
  type: ActionTypeKeys.CLEANUP;
}

export function cleanup(): ICleanupAction {
  return { type: ActionTypeKeys.CLEANUP };
}

// Reducer

export default function queue(
  state: IQueueState,
  action: ActionTypes
): IQueueState {
  switch (action.type) {
    case ActionTypeKeys.ADD_OR_UPDATE_ITEM: {
      return {
        // Todo...add the commented-out uniqBy to this.
        // Use reselect to optimise.
        queue: sortedQueue(state.queue),
        ...state,
        // ...state,
        // queue: sortedQueue(
        //   uniqBy([action.item, ...state.queue], item => item.clientMutationId)
        // ),
      };
    }

    default: {
      return state;
    }
  }
}

// Utils
function sortedQueue(queue: IQueueItem[]) {
  return orderBy(queue, INSTANCE.order.by, INSTANCE.order.direction);
}
