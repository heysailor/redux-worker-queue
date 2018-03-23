import { combineReducers, Store, Reducer, AnyAction } from 'redux';
import { orderBy, uniqBy, reject } from 'lodash';
import { createSelector } from 'reselect';
import {
  INewQueueItem,
  IQueueItem,
  ClientMutationId,
  QueueItem,
} from '../item';
import { INSTANCE } from '../WorkerQueue';
import { ActionTypes, IRootState } from '../duck';

export type ItemQueue = IQueueItem[];

const initialState: ItemQueue = [];

// See this for a explanation of this approach, including use of 'OTHER'
// https://spin.atomicobject.com/2017/07/24/redux-action-pattern-typescript/
export enum ActionTypeKeys {
  ADD_OR_UPDATE_ITEM = '__QUEUE__ADD_OR_UPDATE_ITEM',
  REMOVE_ITEM = '__QUEUE__REMOVE_ITEM',
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

// Reducers

export default function queueReducer(
  state: ItemQueue = initialState,
  action: ActionTypes
): ItemQueue {
  switch (action.type) {
    case ActionTypeKeys.ADD_OR_UPDATE_ITEM: {
      return orderedItemQueue(uniqueItemQueue([action.item, ...state]));
    }
    case ActionTypeKeys.REMOVE_ITEM: {
      return rejectedItemQueue(state, action.clientMutationId);
    }
    case ActionTypeKeys.__CLEAR__: {
      return [];
    }

    default: {
      return state;
    }
  }
}

// Selectors

// Utils - all return new array
const uniqueItemQueue = (queue: ItemQueue): ItemQueue =>
  uniqBy(queue, (item: IQueueItem) => item.clientMutationId);

const orderedItemQueue = (queue: ItemQueue): ItemQueue =>
  orderBy(queue, INSTANCE.settings.order.by, INSTANCE.settings.order.direction);

const rejectedItemQueue = (
  queue: ItemQueue,
  clientMutationId: ClientMutationId
): ItemQueue =>
  reject(
    queue,
    (item: IQueueItem) => item.clientMutationId === clientMutationId
  );
