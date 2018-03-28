"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerQueue_1 = require("../WorkerQueue");
exports.activeWorkers = [];
class FlushWorker {
    constructor(queueItem, flag) {
        this.item = queueItem;
        this.flag = flag;
        this.handlers = WorkerQueue_1.INSTANCE.getHandlersForType(queueItem.type);
    }
    process() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.handlers || !this.handlers.length) {
                throw new Error(`Must register at least one handler for ${this.item.type} type of queue item.`);
            }
            const handler = this.handlers[this.flag.handlerIndex];
            // Succesfully traversed all handlers
            if (!handler) {
                return { ok: true, item: this.item };
            }
            // Handler should only error if coding snafu. Catch error so there isn't a meltdown.
            try {
                return yield handler(this.item);
            }
            catch (e) {
                if (console && console.error) {
                    console.error(`Your handler for queued item with clientMutationId ${this.item.clientMutationId} of type ${this.item.type} returned an error, which is bad. Handlers should _always_ return { ok: boolean, item: QueueItem }. Place any errors in QueueItem.errors. The error was '${e}'`);
                }
                // Resolving this way without any item change will trigger lockout.
                return { ok: false, item: this.item };
            }
        });
    }
}
exports.FlushWorker = FlushWorker;
//# sourceMappingURL=worker.js.map