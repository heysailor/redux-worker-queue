import { Action } from 'redux';
import { INewQueueItem, IQueueItem } from '../item';

// Updating a queue item is easy - just set the new item with this function.
// Make sure to keep the same createdAt argument, or the order of items
// will jump around in the queue.
// Queue updates by removing any older version, as identified with clientMutationId.
export function addOrUpdateQueueItem(queueItem: IQueueItem): Action {
  // sanity check
  if (!isQueueItem(queueItem)) {
    throw new Error(ERRORS('persistence.invalidQueueItem'));
  }

  // Lifecycle.newQueueItem sets essential parameters.
  const parsedItem = {
    ...new QueueItem(queueItem.targetNodeType),
    ...queueItem,
  };

  return { type: types.ADD_ITEM_TO_QUEUE, item: parsedItem };
}
