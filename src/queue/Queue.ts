import { Middleware } from 'redux';
import { isString, isFunction } from 'lodash';
import { middleware } from './middleware';
import { IQueueItem, ItemType } from '../item';

// TODO - import from other file
type Handler = (item: IQueueItem) => Promise<{}>;

interface IHandlers {
  validator: Handler;
  worker: Handler;
  linker: Handler;
}

interface IRegisteredHandlers {
  [key: string]: IHandlers;
}

interface IQueueOptions {
  name?: string;
}

class Queue {
  constructor(opts?: IQueueOptions) {
    if (opts) {
      this._name = opts.name ? opts.name : this._name;
    }
  }

  readonly _handlers: IRegisteredHandlers = {};
  readonly _name: string = 'queue';
  readonly _middleware: Middleware = middleware;

  public registerQueueItemType(
    type: ItemType,
    validator: Handler,
    worker: Handler,
    linker: Handler
  ): boolean | Error {
    if (!type || !isString(type)) {
      throw new Error('Must supply itemType string to register for queue');
    }
    if (!validator || !isFunction(validator)) {
      throw new Error(
        'Must supply validator function for this type of queue item'
      );
    }
    if (!worker || !isFunction(worker)) {
      throw new Error(
        'Must supply worker function for this type of queue item'
      );
    }
    if (!linker || !isFunction(linker)) {
      throw new Error(
        'Must supply linker function for this type of queue item'
      );
    }

    this.addHandlers(type, {
      validator,
      worker,
      linker,
    });

    return true;
  }

  private addHandlers(type: ItemType, handlers: IHandlers) {
    this._handlers[type] = handlers;
  }

  public getHandlersForType(type: ItemType): IHandlers {
    return this._handlers[type];
  }

  public get middleware() {
    return this._middleware;
  }

  public get name(): string {
    return this._name;
  }
}

export default Queue;
