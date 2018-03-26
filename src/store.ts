import {
  createStore,
  applyMiddleware,
  Store as ReduxStore,
  combineReducers,
} from 'redux';
import { middleware } from './middleware';
import WorkerQueue, { INSTANCE } from './WorkerQueue';
import rootReducer from './duck';
import { Store } from './types';

export let store: ReduxStore<object>;

// Store is only created just before first addOrUpdateItem action is dispatched.
// This means that if
export function initStore(externalStore?: any) {
  if (store) return;

  store =
    externalStore || createStore(rootReducer, applyMiddleware(middleware));
}

// wrapped in function, as INSTANCE not around before WokerQueue.init() called
export const rootSelector = (
  state: any,
  workerQueueInstance: WorkerQueue
): Store.All => workerQueueInstance.rootSelector(state);
