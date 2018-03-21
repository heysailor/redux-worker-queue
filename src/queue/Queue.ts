import { isString, isFunction } from 'lodash';

// TODO - import from other file
type Validator = () => any;
// TODO
type Worker = () => any;
// TODO
type Linker = () => any;
// TODO
interface QueueItem {
  type: string;
}

type ItemType = string;

interface IHandlers {
  validator: Validator;
  worker: Worker;
  linker: Linker;
}

interface IREGISTERED_HANDLERS {
  [key: string]: IHandlers;
}

class Queue {
  private HANDLERS: IREGISTERED_HANDLERS = {};
  private _name: string;

  constructor(name?: string) {
    this._name = name || 'queue';
  }

  public registerQueueItemType(
    type: ItemType,
    validator: Validator,
    worker: Worker,
    linker: Linker
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
    this.HANDLERS[type] = handlers;
  }

  public getHandlers(type: ItemType): IHandlers {
    return this.HANDLERS[type];
  }
}

export default Queue;
