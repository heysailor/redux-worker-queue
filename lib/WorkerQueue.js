"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const duck_1 = require("./queue/duck");
const main_1 = require("./main");
class WorkerQueue {
    constructor(opts) {
        this._handlers = {};
        this.actions = {
            addOrUpdateItem: duck_1.addOrUpdateItem,
            removeItem: duck_1.removeItem,
            __clearQueue__: duck_1.__clearQueue__,
        };
        if (exports.INSTANCE) {
            throw new Error(`A queue exists already`);
        }
        // Bit clunky, as all values may be undefined.
        this.settings = {
            order: {
                by: opts && opts.order && opts.order.by ? opts.order.by : ['createdAt'],
                direction: opts && opts.order && opts.order.direction
                    ? opts.order.direction
                    : 'asc',
            },
        };
        exports.INSTANCE = this;
    }
    registerQueueItemType(type, preWorker, worker, postWorker) {
        if (!type || !lodash_1.isString(type)) {
            throw new Error('Must supply itemType string to register for queue');
        }
        if (!preWorker || !lodash_1.isFunction(preWorker)) {
            throw new Error(`Must supply preWorker function for this queue item type ${type}`);
        }
        if (!worker || !lodash_1.isFunction(worker)) {
            throw new Error(`Must supply worker function for this queue item type ${type}`);
        }
        if (!postWorker || !lodash_1.isFunction(postWorker)) {
            throw new Error(`Must supply postWorker function for this queue item type ${type}`);
        }
        this.addHandlers(type, {
            preWorker,
            worker,
            postWorker,
        });
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
    addOrUpdateQueueItem(item) {
        main_1.store.dispatch(this.actions.addOrUpdateItem(item));
    }
    removeItem(clientMutationId) {
        main_1.store.dispatch(this.actions.removeItem(clientMutationId));
    }
    clearQueue() {
        main_1.store.dispatch(this.actions.__clearQueue__());
    }
}
exports.default = WorkerQueue;
//# sourceMappingURL=WorkerQueue.js.map