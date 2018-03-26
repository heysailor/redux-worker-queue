import { combineReducers, Reducer } from 'redux';
import { map } from 'lodash';

import { Store, __clearQueue__Action, CleanAction } from './types';
import queue from './queue/duck';
import flag from './flag/duck';
import { INSTANCE } from './WorkerQueue';

export enum ActionTypes {
  __CLEAR__ = '__WORKER_QUEUE__CLEAR__',
  CLEAN = '__WORKER_QUEUE__CLEAN',
}

// Actions
// Wipe queue  ## DANGER ZONE ##
export const __clearQueue__ = (): __clearQueue__Action => {
  return { type: ActionTypes.__CLEAR__ };
};

export const clean = (): CleanAction => {
  return {
    type: ActionTypes.CLEAN,
  };
};

const allReducers: Reducer<Store.All> = combineReducers({
  queue,
  flag,
});

export default allReducers;
