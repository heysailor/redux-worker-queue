"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerQueue_1 = require("../WorkerQueue");
class FlushWorker {
    constructor(queueItem) {
        this.item = queueItem;
        this.handlers = WorkerQueue_1.INSTANCE.getHandlersForType(queueItem.type);
    }
    start() {
        return new Promise((resolve, reject) => {
            if (!this.handlers || !this.handlers.length) {
                reject(new Error(`Must register at least one handler for ${this.item.type} type of queue item.`));
            }
            const handler = this.handlers[this.item.handlerIndex];
            // Succesfully traversed all handlers
            if (!handler) {
                resolve({ ok: true, item: this.item });
            }
            // Handler should only error if coding snafu.
            try {
                handler(this.item);
            }
            catch (_a) {
                // Resolving this way without any item change will trigger lockout.
                resolve({ ok: false, item: this.item });
            }
        });
    }
}
exports.FlushWorker = FlushWorker;
//# sourceMappingURL=worker.js.map