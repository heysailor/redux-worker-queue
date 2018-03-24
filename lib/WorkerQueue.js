"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const duck_1 = require("./duck");
const duck_2 = require("./queue/duck");
const main_1 = require("./main");
const MAX_WORKERS = 50;
// type QueueOrderByOptions = ('createdAt' | 'clientMutationId')[];
// type QueueOrderDirectionOptions = 'asc' | 'desc';
// interface IWorkerQueueOrderSettings {
//   by: QueueOrderByOptions;
//   direction: QueueOrderDirectionOptions;
// }
class WorkerQueue {
    constructor(types, opts) {
        this._handlers = {};
        this.actions = {
            addOrUpdateItem: duck_2.addOrUpdateItem,
            removeItem: duck_2.removeItem,
            __clearQueue__: duck_1.__clearQueue__,
            flush: duck_1.flush,
        };
        if (exports.INSTANCE) {
            throw new Error(`A queue exists already`);
        }
        if (!types || (!lodash_1.isArray(types) && !lodash_1.isObject(types))) {
            throw new Error(`Must register at least one QueueItem type with one handler.`);
        }
        if (opts) {
            if (!validWorkerCount(opts.workers)) {
                throw new Error(`Worker count must be an integer between 1 and ${MAX_WORKERS}`);
            }
        }
        // Bit clunky, as all values may be undefined.
        this.settings = {
            order: {
                by: opts && opts.order && opts.order.by ? opts.order.by : ['createdAt'],
                direction: opts && opts.order && opts.order.direction
                    ? opts.order.direction
                    : 'asc',
            },
            workers: opts && opts.workers ? opts.workers : 2,
        };
        if (lodash_1.isArray(types)) {
            types.map(reg => this.registerQueueItemType(reg));
        }
        else {
            this.registerQueueItemType(types);
        }
        exports.INSTANCE = this;
    }
    registerQueueItemType(itemType) {
        if (!itemType || !lodash_1.isString(itemType.type)) {
            throw new Error('Must supply itemType string to register for queue');
        }
        if (!lodash_1.isArray(itemType.handlers) ||
            !itemType.handlers.length ||
            !itemType.handlers.every(lodash_1.isFunction)) {
            throw new Error(`Bad or missing handler function for queue item type ${itemType.type}`);
        }
        this.addHandlers(itemType.type, itemType.handlers);
        return true;
    }
    addHandlers(type, handlers) {
        this._handlers[type] = handlers;
    }
    getHandlersForType(type) {
        return this._handlers[type];
    }
    get order() {
        return this.settings.order;
    }
    get workers() {
        return this.settings.workers;
    }
    set workers(count) {
        if (!validWorkerCount(count)) {
            throw new Error(`Worker count must be an integer between 1 and ${MAX_WORKERS}`);
        }
        this.settings.workers = count;
    }
    addOrUpdateQueueItem(item) {
        main_1.store.dispatch(this.actions.addOrUpdateItem(item));
    }
    removeItem(clientMutationId) {
        main_1.store.dispatch(this.actions.removeItem(clientMutationId));
    }
    flush() {
        main_1.store.dispatch(this.actions.flush());
    }
    clearQueue() {
        main_1.store.dispatch(this.actions.__clearQueue__());
    }
}
exports.default = WorkerQueue;
function validWorkerCount(count) {
    return !(!count ||
        count === undefined ||
        !lodash_1.isNumber(count) ||
        !lodash_1.isInteger(count) ||
        count < 1 ||
        count > MAX_WORKERS);
}
//# sourceMappingURL=WorkerQueue.js.map