import { createStore } from 'redux';
import { middleware as workerQueueMiddleware } from './middleware';
import rootReducer from './duck';
import WorkerQueue from './WorkerQueue';

let store = createStore(rootReducer);

export function replaceStore(externalStore: any) {
  store = externalStore;
}

export { WorkerQueue, workerQueueMiddleware, store };
