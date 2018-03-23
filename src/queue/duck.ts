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
import { IRootState, GlobalActionTypeKeys } from '../duck';
import { orderedItems, uniqueItems, rejectedItems } from '../util';

export type ItemQueue = IQueueItem[];

const initialState: ItemQueue = [];

// See this for a explanation of this approach, including use of 'OTHER'
// https://spin.atomicobject.com/2017/07/24/redux-action-pattern-typescript/
export enum QueueActionTypeKeys {
  ADD_OR_UPDATE_ITEM = '__QUEUE__ADD_OR_UPDATE_ITEM',
  REMOVE_ITEM = '__QUEUE__REMOVE_ITEM',
  OTHER = '__any_other_action__',
}

// Add or update queue item

export interface IAddOrUpdateItemAction {
  type: QueueActionTypeKeys.ADD_OR_UPDATE_ITEM;
  item: IQueueItem;
}

export function addOrUpdateItem(
  queueItem: INewQueueItem | IQueueItem
): IAddOrUpdateItemAction {
  return {
    type: QueueActionTypeKeys.ADD_OR_UPDATE_ITEM,
    item: new QueueItem(queueItem),
  };
}

// Remove queue item

export interface IRemoveItemAction {
  type: QueueActionTypeKeys.REMOVE_ITEM;
  clientMutationId: ClientMutationId;
}
export function removeItem(
  clientMutationId: ClientMutationId
): IRemoveItemAction {
  return { type: QueueActionTypeKeys.REMOVE_ITEM, clientMutationId };
}

// Reducers

export default function queue(
  state: ItemQueue = initialState,
  action: AnyAction
): ItemQueue {
  switch (action.type) {
    case QueueActionTypeKeys.ADD_OR_UPDATE_ITEM: {
      return orderedItems(uniqueItems([action.item, ...state]));
    }
    case QueueActionTypeKeys.REMOVE_ITEM: {
      return rejectedItems(state, action.clientMutationId);
    }
    case GlobalActionTypeKeys.__CLEAR__: {
      return [];
    }

    default: {
      return state;
    }
  }
}

// Selectors
