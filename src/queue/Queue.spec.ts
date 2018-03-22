import Queue, { IQueueOptions } from './Queue';
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

  test('allows only instance to be created', () => {
    function newWithNoNameSpecified() {
      const another = new Queue();
    }
    function newWithAnotherNameSpecified() {
      const another2 = new Queue({ name: 'boo' });
    }
    expect(newWithNoNameSpecified).toThrowError();
    expect(newWithAnotherNameSpecified).toThrowError();
  });

  describe('methods', () => {
    describe('registerQueueItemType()', () => {
      test('exists', () => {
        expect(newQueue.registerQueueItemType).toBeDefined();
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

    describe('getHandlersForType()', () => {
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
  });
  describe('properties', () => {
    describe('name', () => {
      test('returns the default queue name "workerQueue" when queue instantiated without a name', () => {
        expect(newQueue.name).toEqual('workerQueue');
      });

      // Can't easily test without removing one-instance block
      // test('returns the provided queue name when queue instantiated with a name option', () => {
      //   const newQueue = new Queue({
      //     name: 'boo',
      //   });
      //   expect(newQueue.name).toEqual('boo');
      // });
    });

    describe('action creator linking', () => {
      test('addOrUpdateItem() exists', () => {
        expect(newQueue.actions.addOrUpdateItem).toBeDefined();
      });
      test('removeItem() exists', () => {
        expect(newQueue.actions.removeItem).toBeDefined();
      });
    });

    describe('order', () => {
      test('exists', () => {
        expect(newQueue.order).toBeDefined();
      });

      test('returns {by: ["createdAt"], direction: "asc"} when queue instantiated without a order option', () => {
        expect(newQueue.order).toMatchObject({
          by: ['createdAt'],
          direction: 'asc',
        });
      });

      // Can't easily test without removing one-instance block
      // test('returns {by:["clientMutationId"]}  when queue instantiated with {order:{by:["clientMutationId"]}} option', () => {
      //   const opts: IQueueOptions = {
      //     order: { by: ['clientMutationId'] },
      //     name: 'order1',
      //   };
      //   const order1 = new Queue(opts);
      //   expect(order1.order).toMatchObject({
      //     by: ['clientMutationId'],
      //     direction: 'asc',
      //   });
      // });

      // Can't easily test without removing one-instance block
      // test('returns {by:["createdAt"],direction:"desc" } when queue instantiated with {order:{direction:["desc"]}} option', () => {
      //   const opts: IQueueOptions = {
      //     order: { by: ['createdAt'], direction: 'desc' },
      //     name: 'order2',
      //   };
      //   const order2 = new Queue(opts);
      //   expect(order2.order).toMatchObject({
      //     by: ['createdAt'],
      //     direction: 'desc',
      //   });
      // });
    });
  });
});
