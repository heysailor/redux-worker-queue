import {
  createStore,
  applyMiddleware,
  Store as ReduxStore,
  combineReducers,
} from 'redux';
import { middleware } from './middleware';
import WorkerQueue, { INSTANCE } from './WorkerQueue';
import rootReducer, { defaultRootSelector } from './duck';
import { Store } from './types';

export let store: ReduxStore<object>;

// Store is only created just before first addOrUpdateItem action is dispatched.
// This means that if
export function initStore(externalStore?: any) {
  if (store) return;

  // If reduxRootSelector is set and not using external store, it'll stuff things up.
  if (!externalStore && INSTANCE.rootSelector !== defaultRootSelector) {
    throw new Error(`
      Do not use reduxRootSelector if not connecting to an external redux store. Doing so will likely cause queue to fail.
    `);
  }

  store =
    externalStore || createStore(rootReducer, applyMiddleware(middleware));
}
