"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = __importDefault(require("./Queue"));
require("jest");
describe('Queue', () => {
    test('loads', () => {
        expect(Queue_1.default).toBeTruthy();
    });
    const newQueue = new Queue_1.default();
    test('is a class', () => {
        expect(newQueue).toBeInstanceOf(Queue_1.default);
    });
    test('allows only instance to be created', () => {
        function another() {
            const another = new Queue_1.default();
        }
        function again() {
            const another2 = new Queue_1.default();
        }
        expect(another).toThrowError();
        expect(again).toThrowError();
    });
    describe('methods', () => {
        describe('registerQueueItemType()', () => {
            test('exists', () => {
                expect(newQueue.registerQueueItemType).toBeDefined();
            });
            test('returns true when called with 4 arguments: (type: string, preWorker: func, worker: func, postWorker: func)', () => {
                const type = 'TYPE';
                const item = { type };
                const handler = (type) => new Promise((resolve, reject) => {
                    resolve(true);
                });
                const preWorker = handler;
                const postWorker = handler;
                const worker = handler;
                expect(newQueue.registerQueueItemType(type, worker, preWorker, postWorker)).toBeTruthy();
            });
        });
        describe('getHandlersForType()', () => {
            test('takes a itemType string as its argument', () => {
                expect(newQueue.getHandlersForType('srhaf')).toBeUndefined();
            });
            test('returns a handlers object when called with a corresponding itemType string', () => {
                const type = 'TYPE';
                const item = { type };
                const handler = (type) => new Promise((resolve, reject) => {
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
                const queueItem = {
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
//# sourceMappingURL=Queue.spec.js.map