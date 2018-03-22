import Queue from './Queue';
import { IQueueItem } from '../item';
import 'jest';

describe('Queue', () => {
  test('loads', () => {
    expect(Queue).toBeTruthy();
  });
  const newQueue = new Queue();
  test('is a class', () => {
    expect(newQueue).toBeInstanceOf(Queue);
  });
});

describe('Queue.name', () => {
  const newQueue = new Queue();
  test('exists', () => {
    expect(newQueue.name).toBeTruthy();
  });

  test('returns the default queue name when queue instantiated without a name', () => {
    expect(newQueue.name).toEqual('queue');
  });

  test('returns the provided queue name when queue instantiated with a name option', () => {
    const namedQueue = new Queue({ name: 'boo' });
    expect(namedQueue.name).toEqual('boo');
  });
});

describe('Queue.registerQueueItemType', () => {
  const newQueue = new Queue();
  test('exists', () => {
    expect(newQueue.registerQueueItemType).toBeTruthy();
  });

  test('returns true when called with 4 arguments: (type: string, validator: func, worker: func, linker: func)', () => {
    const type = 'TYPE';
    const item = { type };
    const handler = (type: IQueueItem) =>
      new Promise((resolve, reject) => {
        resolve(true);
      });
    const validator = handler;
    const linker = handler;
    const worker = handler;
    expect(
      newQueue.registerQueueItemType(type, worker, validator, linker)
    ).toBeTruthy();
  });
});

describe('Queue.getHandlersForType', () => {
  const newQueue = new Queue();
  test('exists', () => {
    expect(newQueue.getHandlersForType).toBeTruthy();
  });

  test('takes a itemType string as its argument', () => {
    expect(newQueue.getHandlersForType('srhaf')).toBeUndefined();
  });

  test('returns a handlers object when called with a corresponding itemType string', () => {
    const type = 'TYPE';
    const item = { type };
    const handler = (type: IQueueItem) =>
      new Promise((resolve, reject) => {
        resolve(true);
      });
    const validator = handler;
    const linker = handler;
    const worker = handler;

    newQueue.registerQueueItemType(type, worker, validator, linker);
    const handlers = newQueue.getHandlersForType(type);

    expect(handlers).toBeDefined();
    expect(handlers.validator).toBeDefined();
    expect(handlers.worker).toBeDefined();
    expect(handlers.linker).toBeDefined();
    expect(handlers.worker).toBeInstanceOf(Function);
    expect(handlers.validator).toBeInstanceOf(Function);
    expect(handlers.linker).toBeInstanceOf(Function);
  });
});

describe('Queue.middleware', () => {
  const newQueue = new Queue();
  test('exists', () => {
    expect(newQueue.middleware).toBeTruthy();
  });

  test('returns a function', () => {
    expect(newQueue.middleware).toBeInstanceOf(Function);
  });
});
