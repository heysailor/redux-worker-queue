import { createStore } from 'redux';
import { middleware } from './middleware';
import rootReducer from './duck';
import { Queue } from './queue';

let store = createStore(rootReducer);

export function replaceStore(externalStore: any) {
  store = externalStore;
}

export { Queue, middleware, store };
