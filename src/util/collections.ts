import { uniqBy, reject, orderBy } from 'lodash';
import { ClientMutationId, IItem } from '../item';
import { INSTANCE } from '../WorkerQueue';

// All return new array
export function uniqueItems<T extends IItem>(items: T[]): T[] {
  return uniqBy(items, (item: T) => item.clientMutationId);
}

// Uses settings from WorkerQueue instance
export function orderedItems<T extends IItem>(items: T[]): T[] {
  return orderBy(
    items,
    INSTANCE.settings.order.by,
    INSTANCE.settings.order.direction
  );
}

// Rejects by clientMutationId
export function rejectedItems<T extends IItem>(
  items: T[],
  clientMutationId: ClientMutationId
): T[] {
  return reject(
    items,
    (item: IItem) => item.clientMutationId === clientMutationId
  );
}
