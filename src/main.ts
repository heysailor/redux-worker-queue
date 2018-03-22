import { createStore } from 'redux';
import { middleware as workerQueueMiddleware } from './middleware';
import rootReducer from './duck';
import { Queue } from './queue';

const store = createStore(rootReducer);

export { Queue, workerQueueMiddleware, store };
