"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerQueue_1 = __importDefault(require("./WorkerQueue"));
require("jest");
const initialWorkerCount = 2;
const handler = (item) => new Promise((resolve, reject) => resolve({ ok: true, item }));
describe('WorkerQueue', () => {
    const newQueue = new WorkerQueue_1.default({
        type: 'PETS',
        handlers: [handler],
    }, {
        workers: initialWorkerCount,
    });
    test('loads', () => {
        expect(WorkerQueue_1.default).toBeTruthy();
    });
    test('is a class which instantiates', () => {
        expect(newQueue).toBeInstanceOf(WorkerQueue_1.default);
    });
    test('allows only instance to be created', () => {
        function another() {
            const another = new WorkerQueue_1.default({
                type: 'HUMANS',
                handlers: [handler],
            });
        }
        expect(another).toThrowError();
    });
    test('sets its worker count on initialisation with options', () => {
        expect(newQueue.workers).toEqual(initialWorkerCount);
    });
    test('worker property can be set to a maximum', () => {
        function tooMany() {
            newQueue.workers = 60;
        }
        expect(tooMany).toThrowError();
        expect(newQueue.workers).toEqual(initialWorkerCount);
        newQueue.workers = 5;
        expect(newQueue.workers).toEqual(5);
    });
    describe('methods', () => {
        describe('getHandlersForType()', () => {
            test('takes a itemType string as its argument', () => {
                expect(newQueue.getHandlersForType('srhaf')).toBeUndefined();
            });
            test('returns a handlers array when called with a corresponding itemType string', () => {
                const type = 'HUMANS';
                const humanHandler = (item) => new Promise((resolve, reject) => resolve({ ok: true, item }));
                newQueue.registerQueueItemType({
                    type,
                    handlers: [handler, humanHandler],
                });
                const handlers = newQueue.getHandlersForType(type);
                expect(handlers).toBeDefined();
                expect(handlers).toBeInstanceOf(Array);
                expect(handlers[0]).toBeDefined();
                expect(handlers[1]).toEqual(humanHandler);
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
            test('flush() calls the flush action creator', () => {
                expect(newQueue.flush).toBeDefined();
                const spy = jest.spyOn(newQueue.actions, 'flush');
                newQueue.flush();
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
            //   const opts: IWorkerQueueOptions = {
            //     order: { by: ['clientMutationId'] },
            //     name: 'order1',
            //   };
            //   const order1 = new WorkerQueue(opts);
            //   expect(order1.order).toMatchObject({
            //     by: ['clientMutationId'],
            //     direction: 'asc',
            //   });
            // });
            // Can't easily test without removing one-instance block
            // test('returns {by:["createdAt"],direction:"desc" } when queue instantiated with {order:{direction:["desc"]}} option', () => {
            //   const opts: IWorkerQueueOptions = {
            //     order: { by: ['createdAt'], direction: 'desc' },
            //     name: 'order2',
            //   };
            //   const order2 = new WorkerQueue(opts);
            //   expect(order2.order).toMatchObject({
            //     by: ['createdAt'],
            //     direction: 'desc',
            //   });
            // });
        });
    });
});
//# sourceMappingURL=WorkerQueue.spec.js.map