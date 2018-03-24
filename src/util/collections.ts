import { uniqBy, reject, orderBy } from 'lodash';
import { INSTANCE } from '../WorkerQueue';

// All return new array
export function uniqueItems<T extends Identified>(items: T[]): T[] {
  return uniqBy(items, (item: T) => item.clientMutationId);
}

// Uses settings from WorkerQueue instance
export function orderedItems<T extends Identified>(items: T[]): T[] {
  return orderBy(
    items,
    INSTANCE.settings.order.by,
    INSTANCE.settings.order.direction
  );
}

// Rejects by clientMutationId
export function rejectedItems<T extends Identified>(
  items: T[],
  clientMutationId: ClientMutationId
): T[] {
  return reject(
    items,
    (item: Identified) => item.clientMutationId === clientMutationId
  );
}
