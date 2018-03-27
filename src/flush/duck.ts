import { differenceBy, uniqBy } from 'lodash';

import WorkerQueue, { INSTANCE } from '../WorkerQueue';
import { flush as flushThunk } from './thunk';

import * as queueDuck from '../queue/duck';
import * as flagDuck from '../flag/duck';

// Selectors

export function flushableItemsSelector(state: any, INSTANCE: WorkerQueue) {
  const badFlags = uniqBy(
    [
      ...flagDuck.haltedFlagsSelector(state, INSTANCE),
      ...flagDuck.lockedFlagsSelector(state, INSTANCE),
      ...flagDuck.workingFlagsSelector(state, INSTANCE),
    ],
    'clientMutationId'
  );
  console.log('BAD FLAGS', badFlags);
  return differenceBy(
    queueDuck.queueSelector(state, INSTANCE),
    badFlags,
    'clientMutationId'
  );
}

// Thunks

export const flush = flushThunk;
