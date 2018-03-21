import { Action } from 'redux';
import {
  QueueItem,
  INewQueueItem,
  IQueueItem,
  ClientMutationId,
} from '../item';
import {
  ActionTypeKeys,
  IAddItemAction,
  IRemoveItemAction,
  I__clearQueue__Action,
  ICleanupAction,
} from './types';

// Updating a queue item is easy - just set the new item with this function.
// Make sure to keep the same createdAt argument, or the order of items
// will jump around in the queue.
// Queue updates by removing any older version, as identified with clientMutationId.
export function addOrUpdateItem(
  queueItem: INewQueueItem | IQueueItem
): IAddItemAction {
  return {
    type: ActionTypeKeys.ADD_OR_UPDATE_ITEM,
    item: new QueueItem(queueItem),
  };
}

export function removeItem(
  clientMutationId: ClientMutationId
): IRemoveItemAction {
  return { type: ActionTypeKeys.REMOVE_ITEM, clientMutationId };
}

// Development only, for erasing all queue items.
export function __clearQueue__(): I__clearQueue__Action {
  return { type: ActionTypeKeys.__CLEAR__ };
}

// For removing completed items.
export function cleanup(): ICleanupAction {
  return { type: ActionTypeKeys.CLEANUP };
}
