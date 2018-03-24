import { combineReducers, Reducer } from 'redux';
import { fork, all } from 'redux-saga/effects';
import { map } from 'lodash';

import { Store, __clearQueue__Action, CleanAction, FlushAction } from './types';
import { sagas as coordinatorSagas } from './coordinator/sagas';
import queue from './queue/duck';
import flag from './flag/duck';

export enum ActionTypes {
  __CLEAR__ = '__WORKER_QUEUE__CLEAR__',
  FLUSH = '__WORKER_QUEUE__FLUSH',
  CLEAN = '__WORKER_QUEUE__CLEAN',
}

// Allows anything else to come in.
interface StoreEnhancerState {}

// Actions
// Wipe queue  ## DANGER ZONE ##
export const __clearQueue__ = (): __clearQueue__Action => ({
  type: ActionTypes.__CLEAR__,
});

export const clean = (): CleanAction => ({
  type: ActionTypes.CLEAN,
});

export const flush = (): FlushAction => ({
  type: ActionTypes.FLUSH,
});

const allReducers = combineReducers({
  queue,
  flag,
});

const rootReducer: Reducer<Store.All> = combineReducers({
  workerQueue: allReducers,
});

export default rootReducer;

// Sagas
const combinedSagas = { ...coordinatorSagas };

export function* rootSagas() {
  yield all(map(combinedSagas, fork));
}
