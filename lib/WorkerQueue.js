"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const store_1 = require("./store");
const middleware_1 = require("./middleware");
const queueDuck = __importStar(require("./queue/duck"));
const flushDuck = __importStar(require("./flush/duck"));
const rootDuck = __importStar(require("./duck"));
const flagDuck = __importStar(require("./flag/duck"));
const MAX_WORKERS = 999;
class WorkerQueue {
    constructor(types, opts) {
        this._handlers = {};
        this.initStore = store_1.initStore;
        this.EXTERNAL_STORE = false;
        this._defaultRootSelector = (state) => {
            return this.EXTERNAL_STORE ? state.workerQueue : state;
        };
        this._rootSelector = this._defaultRootSelector;
        this.actions = {
            addOrUpdateItem: queueDuck.addOrUpdateItem,
            removeItem: queueDuck.removeItem,
            __clearQueue__: rootDuck.__clearQueue__,
            flush: flushDuck.flush,
            clean: flagDuck.clean,
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
            if (opts.reduxRootSelector) {
                this._rootSelector = opts.reduxRootSelector;
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
        this._handlers[type] = [...handlers];
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
        store_1.store.dispatch(this.actions.addOrUpdateItem(item));
    }
    removeItem(clientMutationId) {
        store_1.store.dispatch(this.actions.removeItem(clientMutationId));
    }
    flush() {
        store_1.store.dispatch(this.actions.flush());
    }
    clearQueue() {
        store_1.store.dispatch(this.actions.__clearQueue__());
    }
    get middleware() {
        this.onExternalStore();
        return middleware_1.middleware;
    }
    get reducers() {
        this.onExternalStore();
        return rootDuck.default;
    }
    onExternalStore() {
        this.EXTERNAL_STORE = true;
    }
    rootSelector(state) {
        return this._rootSelector(state);
    }
    init() {
        if (this.EXTERNAL_STORE) {
            throw new Error(`Don't call init when integrating with external redux.`);
        }
        // If reduxRootSelector is set and not using external store, it'll stuff things up.
        if (!this.EXTERNAL_STORE &&
            this._rootSelector !== this._defaultRootSelector) {
            throw new Error(`
      Do not use reduxRootSelector if not connecting to an external redux store. Doing so will likely cause queue to fail.
    `);
        }
        store_1.initStore();
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