import Queue, { IQueueOptions } from './Queue';
import { IQueueItem, INewQueueItem } from '../item';
import { addOrUpdateItem } from './duck';
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

      test('returns true when called with 4 arguments: (type: string, preWorker: func, worker: func, postWorker: func)', () => {
        const type = 'TYPE';
        const item = { type };
        const handler = (type: IQueueItem) =>
          new Promise((resolve, reject) => {
            resolve(true);
          });
        const preWorker = handler;
        const postWorker = handler;
        const worker = handler;
        expect(
          newQueue.registerQueueItemType(type, worker, preWorker, postWorker)
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
        const preWorker = handler;
        const postWorker = handler;
        const worker = handler;

        newQueue.registerQueueItemType(type, worker, preWorker, postWorker);
        const handlers = newQueue.getHandlersForType(type);

        expect(handlers).toBeDefined();
        expect(handlers.preWorker).toBeDefined();
        expect(handlers.worker).toBeDefined();
        expect(handlers.postWorker).toBeDefined();
        expect(handlers.worker).toBeInstanceOf(Function);
        expect(handlers.preWorker).toBeInstanceOf(Function);
        expect(handlers.postWorker).toBeInstanceOf(Function);
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
      test('__clearQueue__() exists', () => {
        expect(newQueue.actions.__clearQueue__).toBeDefined();
      });
    });

    describe('direct item management:', () => {
      test('addOrUpdateQueueItem() calls the addOrUpdateQueueItem action creator', () => {
        expect(newQueue.addOrUpdateQueueItem).toBeDefined();

        const spy = jest.spyOn(newQueue.actions, 'addOrUpdateItem');
        const queueItem: INewQueueItem = {
          type: 'SNOT',
          payload: {
            consistency: 'stringy',
          },
        };

        newQueue.addOrUpdateQueueItem(queueItem);
        expect(spy).toHaveBeenCalled();

        spy.mockReset();
        spy.mockRestore();
      });
      test('removeItem() calls the removeItem action creator', () => {
        expect(newQueue.removeItem).toBeDefined();
        const spy = jest.spyOn(newQueue.actions, 'removeItem');

        newQueue.removeItem('wrsdxc');
        expect(spy).toHaveBeenCalled();

        spy.mockReset();
        spy.mockRestore();
      });
      test('clearQueue() calls the __clearQueue__ action creator', () => {
        expect(newQueue.clearQueue).toBeDefined();
        const spy = jest.spyOn(newQueue.actions, '__clearQueue__');

        newQueue.clearQueue();
        expect(spy).toHaveBeenCalled();

        spy.mockReset();
        spy.mockRestore();
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
