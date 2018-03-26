import { combineReducers, Reducer } from 'redux';
import { map } from 'lodash';

import { Store, __clearQueue__Action } from './types';
import * as queueDuck from './queue/duck';
import * as flagsDuck from './flag/duck';

import { INSTANCE } from './WorkerQueue';

export enum ActionTypes {
  __CLEAR__ = '__WORKER_QUEUE__CLEAR__',
}

// Actions
// Wipe queue  ## DANGER ZONE ##
export const __clearQueue__ = (): __clearQueue__Action => {
  return { type: ActionTypes.__CLEAR__ };
};

const allReducers: Reducer<Store.All> = combineReducers({
  queue: queueDuck.default,
  flags: flagsDuck.default,
});

export default allReducers;
