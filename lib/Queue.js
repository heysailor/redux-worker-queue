"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class Queue {
    constructor() {
        this.HANDLERS = {};
    }
    registerQueueItemType(type, validator, worker, linker) {
        if (!type || !lodash_1.isString(type)) {
            throw new Error('Must supply itemType string to register for queue');
        }
        if (!validator || !lodash_1.isFunction(validator)) {
            throw new Error('Must supply validator function for this type of queue item');
        }
        if (!worker || !lodash_1.isFunction(worker)) {
            throw new Error('Must supply worker function for this type of queue item');
        }
        if (!linker || !lodash_1.isFunction(linker)) {
            throw new Error('Must supply linker function for this type of queue item');
        }
        this.addHandlers(type, {
            validator,
            worker,
            linker,
        });
        return true;
    }
    addHandlers(type, handlers) {
        this.HANDLERS[type] = Object.assign({}, handlers);
    }
    getHandlers(type) {
        return this.HANDLERS[type];
    }
}
exports.default = Queue;
//# sourceMappingURL=Queue.js.map