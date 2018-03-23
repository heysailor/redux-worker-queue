import { isString, isFunction, orderBy, isArray, isObject } from 'lodash';
import { IQueueItem, ItemType, ClientMutationId, INewQueueItem } from './item';
import { addOrUpdateItem, removeItem, __clearQueue__ } from './queue/duck';
import { store } from './main';

export let INSTANCE: WorkerQueue;
const MAX_WORKERS = 50;

// TODO - import from other file
type Handler = (item: IQueueItem) => Promise<{}>;
type IHandlers = Handler[];
interface IHandlersForItemType {
  [key: string]: IHandlers;
}
type IRegisterType = {
  type: ItemType;
  handlers: IHandlers;
};

type QueueOrderByOptions = ('createdAt' | 'clientMutationId')[];
type QueueOrderDirectionOptions = 'asc' | 'desc';

interface IWorkerQueueOrderSettings {
  by: QueueOrderByOptions;
  direction: QueueOrderDirectionOptions;
}

// Test parameter allows for instantiation
export interface IWorkerQueueOptions {
  order?: {
    by?: QueueOrderByOptions;
    direction?: QueueOrderDirectionOptions;
  };
  workers?: number;
}

interface IWorkerQueueSettings {
  order: IWorkerQueueOrderSettings;
}

class WorkerQueue {
  constructor(
    types: IRegisterType | IRegisterType[],
    opts?: IWorkerQueueOptions
  ) {
    if (INSTANCE) {
      throw new Error(`A queue exists already`);
    }

    if (!types || (!isArray(types) && !isObject(types))) {
      throw new Error(
        `Must provide at least one QueueItem type with one handler.`
      );
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
    };

    if (opts && opts.workers) {
      this._workers = opts.workers;
    }

    if (isArray(types)) {
      types.map(reg => this.registerQueueItemType(reg));
    } else {
      this.registerQueueItemType(types);
    }

    INSTANCE = this;
  }

  private _workers: number = 1;
  readonly settings: IWorkerQueueSettings;
  readonly _handlers: IHandlersForItemType = {};
  readonly actions = {
    addOrUpdateItem,
    removeItem,
    __clearQueue__,
  };

  public registerQueueItemType(itemType: IRegisterType): boolean | Error {
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

  private addHandlers(type: ItemType, handlers: IHandlers) {
    this._handlers[type] = handlers;
  }
  public getHandlersForType(type: ItemType): IHandlers {
    return this._handlers[type];
  }
  public get order(): IWorkerQueueOrderSettings {
    return this.settings.order;
  }
  public addOrUpdateQueueItem(item: IQueueItem | INewQueueItem) {
    store.dispatch(this.actions.addOrUpdateItem(item));
  }
  public removeItem(clientMutationId: ClientMutationId) {
    store.dispatch(this.actions.removeItem(clientMutationId));
  }
  public clearQueue() {
    store.dispatch(this.actions.__clearQueue__());
  }
  public get workers(): number {
    return this._workers;
  }
  public set workers(count) {
    if (count > MAX_WORKERS) {
      throw new Error(`Max allowed workers is ${MAX_WORKERS}`);
    }
    this._workers = count;
  }
}

export default WorkerQueue;
