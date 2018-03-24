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
} from './types';
import { __clearQueue__, flush } from './duck';
import { Queue } from './queue';
import { addOrUpdateItem, removeItem } from './queue/duck';
import { store } from './main';

// import { isString, isFunction, orderBy, isArray, isObject } from 'lodash';
// import { IQueueItem, ItemType, ClientMutationId, INewQueueItem } from './item';
// import { addOrUpdateItem, removeItem } from './queue/duck';
// import { __clearQueue__, flush } from './duck';

export let INSTANCE: WorkerQueue;
const MAX_WORKERS = 50;

// type QueueOrderByOptions = ('createdAt' | 'clientMutationId')[];
// type QueueOrderDirectionOptions = 'asc' | 'desc';

// interface IWorkerQueueOrderSettings {
//   by: QueueOrderByOptions;
//   direction: QueueOrderDirectionOptions;
// }

class WorkerQueue {
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

  readonly settings: WorkerQueueSettings;
  readonly _handlers: HandlersForQueueItemType = {};
  readonly actions = {
    addOrUpdateItem,
    removeItem,
    __clearQueue__,
    flush,
  };

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
  public getHandlersForType(type: Queue.ItemType): Handler[] {
    return this._handlers[type];
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
    store.dispatch(this.actions.flush());
  }
  public clearQueue() {
    store.dispatch(this.actions.__clearQueue__());
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
