import { createStore } from 'redux';
import { middleware as workerQueueMiddleware } from './middleware';
import rootReducer from './duck';
import WorkerQueue from './WorkerQueue';

let store = createStore(rootReducer);
let storeReplaced = false;
export function replaceStore(externalStore: any) {
  store = externalStore;
  storeReplaced = true;
}

export { WorkerQueue, workerQueueMiddleware, store };
