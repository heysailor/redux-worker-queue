import { combineReducers, Reducer, Dispatch } from 'redux';
import { map } from 'lodash';

import { Queue } from './queue';

import { Store, __clearQueue__Action } from './types';
import * as queueDuck from './queue/duck';
import * as flagDuck from './flag/duck';

import { INSTANCE } from './WorkerQueue';

import { nextTick } from './util';

export enum ActionTypes {
  __CLEAR__ = '__WORKER_QUEUE__CLEAR__',
}

// Actions
// Wipe queue  ## DANGER ZONE ##
export const __clearQueue__ = (): __clearQueue__Action => {
  return { type: ActionTypes.__CLEAR__ };
};

// Wrapper for external API, to remove need to call clean() action creator separately.
export const addOrUpdateItemAndClean = function(
  queueItem: Queue.Item | Queue.NewItemInput
) {
  return async function addOrUpdateItemAndCleanAsync(
    dispatch: Dispatch<Store.All>,
    getState: Function
  ) {
    dispatch(queueDuck.addOrUpdateItem(queueItem));
    await nextTick();
    dispatch(flagDuck.clean());
  };
};

const allReducers: Reducer<Store.All> = combineReducers({
  queue: queueDuck.default,
  flags: flagDuck.default,
});

export default allReducers;
