import { isString, isFunction, orderBy } from 'lodash';
import { IQueueItem, ItemType, ClientMutationId, INewQueueItem } from '../item';
import { addOrUpdateItem, removeItem, __clearQueue__ } from './duck';
import { store } from '../main';

export let INSTANCE: Queue;
const DEFAULT_NAME = 'workerQueue';

// TODO - import from other file
type Handler = (item: IQueueItem) => Promise<{}>;

interface IHandlers {
  preWorker: Handler;
  worker: Handler;
  postWorker: Handler;
}

interface IRegisteredHandlers {
  [key: string]: IHandlers;
}

type QueueOrderByOptions = ('createdAt' | 'clientMutationId')[];
type QueueOrderDirectionOptions = 'asc' | 'desc';

interface IQueueOrderSettings {
  by: QueueOrderByOptions;
  direction: QueueOrderDirectionOptions;
}

// Test parameter allows for instantiation
export interface IQueueOptions {
  name?: string;
  order?: {
    by?: QueueOrderByOptions;
    direction?: QueueOrderDirectionOptions;
  };
}

interface IQueueSettings {
  name: string;
  order: IQueueOrderSettings;
}

class Queue {
  constructor(opts?: IQueueOptions) {
    const name = (opts && opts.name) || DEFAULT_NAME;

    if (INSTANCE) {
      throw new Error(`A queue exists already with the name "${name}".`);
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
      name,
    };

    INSTANCE = this;
  }

  readonly settings: IQueueSettings;
  readonly _handlers: IRegisteredHandlers = {};
  readonly actions = {
    addOrUpdateItem,
    removeItem,
    __clearQueue__,
  };

  public registerQueueItemType(
    type: ItemType,
    preWorker: Handler,
    worker: Handler,
    postWorker: Handler
  ): boolean | Error {
    if (!type || !isString(type)) {
      throw new Error('Must supply itemType string to register for queue');
    }
    if (!preWorker || !isFunction(preWorker)) {
      throw new Error(
        `Must supply preWorker function for this queue item type ${type}`
      );
    }
    if (!worker || !isFunction(worker)) {
      throw new Error(
        `Must supply worker function for this queue item type ${type}`
      );
    }
    if (!postWorker || !isFunction(postWorker)) {
      throw new Error(
        `Must supply postWorker function for this queue item type ${type}`
      );
    }
    this.addHandlers(type, {
      preWorker,
      worker,
      postWorker,
    });

    return true;
  }

  private addHandlers(type: ItemType, handlers: IHandlers) {
    this._handlers[type] = handlers;
  }
  public getHandlersForType(type: ItemType): IHandlers {
    return this._handlers[type];
  }
  public get name(): string {
    return this.settings.name;
  }
  public get order(): IQueueOrderSettings {
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
}

export default Queue;
