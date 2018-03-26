import {
  isArray,
  isObject,
  isNumber,
  isInteger,
  isString,
  isFunction,
} from 'lodash';
import {
  RegisterQueueItemTypeInput,
  WorkerQueueSettings,
  HandlersForQueueItemType,
  Handler,
  Store,
  RootSelector,
} from './types';
import allReducers, { __clearQueue__ } from './duck';
import { Queue } from './queue';
import { addOrUpdateItem, removeItem } from './queue/duck';
import { flushAsync } from './flush/duck';
import { clean } from './flag/duck';
import { store, initStore } from './store';
import { middleware } from './middleware';

export let INSTANCE: WorkerQueue;
const MAX_WORKERS = 999;

class WorkerQueue {
  readonly settings: WorkerQueueSettings;
  readonly _handlers: HandlersForQueueItemType = {};
  readonly initStore: Function = initStore;
  public EXTERNAL_STORE: boolean = false;
  public _defaultRootSelector = (state: any) => {
    return this.EXTERNAL_STORE ? state.workerQueue : state;
  };
  public _rootSelector: (state: any) => Store.All = this._defaultRootSelector;
  readonly actions = {
    addOrUpdateItem,
    removeItem,
    __clearQueue__,
    flushAsync,
    clean,
  };

  constructor(
    types: RegisterQueueItemTypeInput | RegisterQueueItemTypeInput[],
    opts?: Partial<WorkerQueueSettings>
  ) {
    if (INSTANCE) {
      throw new Error(`A queue exists already`);
    }

    if (!types || (!isArray(types) && !isObject(types))) {
      throw new Error(
        `Must register at least one QueueItem type with one handler.`
      );
    }

    if (opts) {
      if (!validWorkerCount(opts.workers)) {
        throw new Error(
          `Worker count must be an integer between 1 and ${MAX_WORKERS}`
        );
      }
      if (opts.reduxRootSelector) {
        this._rootSelector = opts.reduxRootSelector;
      }
    }

    // Bit clunky, as all values may be undefined.
    this.settings = {
      order: {
        by: opts && opts.order && opts.order.by ? opts.order.by : ['createdAt'],
        direction:
          opts && opts.order && opts.order.direction
            ? opts.order.direction
            : 'asc',
      },
      workers: opts && opts.workers ? opts.workers : 2,
    };

    if (isArray(types)) {
      types.map(reg => this.registerQueueItemType(reg));
    } else {
      this.registerQueueItemType(types);
    }

    INSTANCE = this;
  }

  public registerQueueItemType(
    itemType: RegisterQueueItemTypeInput
  ): boolean | Error {
    if (!itemType || !isString(itemType.type)) {
      throw new Error('Must supply itemType string to register for queue');
    }
    if (
      !isArray(itemType.handlers) ||
      !itemType.handlers.length ||
      !itemType.handlers.every(isFunction)
    ) {
      throw new Error(
        `Bad or missing handler function for queue item type ${itemType.type}`
      );
    }
    this.addHandlers(itemType.type, itemType.handlers);

    return true;
  }

  private addHandlers(type: Queue.ItemType, handlers: Handler[]) {
    this._handlers[type] = handlers;
  }
  public getHandlersForType(type: Queue.ItemType) {
    return this._handlers[type] || [];
  }
  public get order(): object {
    return this.settings.order;
  }
  public get workers(): number {
    return this.settings.workers;
  }
  public set workers(count: number) {
    if (!validWorkerCount(count)) {
      throw new Error(
        `Worker count must be an integer between 1 and ${MAX_WORKERS}`
      );
    }
    this.settings.workers = count;
  }
  public addOrUpdateQueueItem(item: Queue.Item | Queue.NewItemInput) {
    store.dispatch(this.actions.addOrUpdateItem(item));
  }
  public removeItem(clientMutationId: ClientMutationId) {
    store.dispatch(this.actions.removeItem(clientMutationId));
  }
  public flush() {
    store.dispatch(this.actions.flushAsync());
  }
  public clearQueue() {
    store.dispatch(this.actions.__clearQueue__());
  }
  get middleware() {
    return middleware;
  }
  get reducers() {
    return allReducers;
  }
  private onExternalStore() {
    this.EXTERNAL_STORE = true;
  }
  public rootSelector(state: any): Store.All {
    return this._rootSelector(state);
  }
  public init() {
    if (this.EXTERNAL_STORE) {
      throw new Error(`Don't call init when integrating with external redux.`);
    }

    // If reduxRootSelector is set and not using external store, it'll stuff things up.
    if (
      !this.EXTERNAL_STORE &&
      this._rootSelector !== this._defaultRootSelector
    ) {
      throw new Error(`
      Do not use reduxRootSelector if not connecting to an external redux store. Doing so will likely cause queue to fail.
    `);
    }
    initStore();
  }
}

export default WorkerQueue;

function validWorkerCount(count: any): boolean {
  return !(
    !count ||
    count === undefined ||
    !isNumber(count) ||
    !isInteger(count) ||
    count < 1 ||
    count > MAX_WORKERS
  );
}
