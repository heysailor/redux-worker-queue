import Queue from './Queue';
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

  test('returns the provided queue name when queue instantiated with a name', () => {
    const namedQueue = new Queue('boo');
    expect(namedQueue.name).toEqual('boo');
  });
});

describe('Queue.registerQueueItemType', () => {
  const newQueue = new Queue();
  test('exists', () => {
    expect(newQueue.registerQueueItemType).toBeTruthy();
  });

  test('returns true when called with 4 arguments: (type: string, validator: func, worker: func, linker: func)', () => {
    const type = 'STRING';
    const worker = () => {};
    const validator = () => {};
    const linker = () => {};
    expect(
      newQueue.registerQueueItemType(type, worker, validator, linker)
    ).toBeTruthy();
  });
});

describe('Queue.getHandlers', () => {
  const newQueue = new Queue();
  test('exists', () => {
    expect(newQueue.getHandlers).toBeTruthy();
  });

  test('takes a itemType string as its argument', () => {
    expect(newQueue.getHandlers('srhaf')).toBeUndefined();
  });

  test('returns a handlers object when called with a corresponding itemType string', () => {
    const type = 'TYPE';
    const worker = () => {};
    const validator = () => {};
    const linker = () => {};

    newQueue.registerQueueItemType(type, worker, validator, linker);
    const handlers = newQueue.getHandlers(type);

    expect(handlers).toBeDefined();
    expect(handlers.validator).toBeDefined();
    expect(handlers.worker).toBeDefined();
    expect(handlers.linker).toBeDefined();
    expect(handlers.worker).toBeInstanceOf(Function);
    expect(handlers.validator).toBeInstanceOf(Function);
    expect(handlers.linker).toBeInstanceOf(Function);
  });
});
