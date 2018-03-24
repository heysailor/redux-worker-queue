import { createStore, applyMiddleware, Store as ReduxStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { middleware as workerQueueMiddleware } from './middleware';
import rootReducer, { rootSagas } from './duck';
import WorkerQueue from './WorkerQueue';
import { Store } from './types';

// Redux Saga
const sagaMiddleware = createSagaMiddleware();

// Create store
let store = createStore(rootReducer, applyMiddleware(sagaMiddleware));
let storeReplaced = false;

// Allow replacement of store, once, eg on middleware use.
export function replaceStore(externalStore: any) {
  store = externalStore;
  storeReplaced = true;
}

// Activate sagas.
sagaMiddleware.run(rootSagas);

export { WorkerQueue, workerQueueMiddleware, store };
