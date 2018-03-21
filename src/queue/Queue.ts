import { Middleware } from 'redux';
import { isString, isFunction } from 'lodash';
import { middleware } from './middleware';
import { IQueueItem } from '../item';

// TODO - import from other file
type Handler = (item: IQueueItem) => Promise<{}>;

type ItemType = string;

interface IHandlers {
  validator: Handler;
  worker: Handler;
  linker: Handler;
}

interface IRegisteredHandlers {
  [key: string]: IHandlers;
}

class Queue {
  constructor(name?: string) {
    this._name = name || 'queue';
  }

  private _handlers: IRegisteredHandlers = {};
  private _name: string;
  private _middleware: Middleware = middleware;

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

  public get name(): string {
    return this._name;
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
}

export default Queue;
