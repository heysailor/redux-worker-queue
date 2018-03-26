import { Queue, QueueItem } from '../queue';
import { INSTANCE } from '../WorkerQueue';
import { Handler, HandlerPromiseResponse } from '../types';
import { Flush } from './types';

export class FlushWorker {
  readonly item: Queue.Item;
  readonly handlers: Handler[];

  constructor(queueItem: Queue.Item) {
    this.item = queueItem;
    this.handlers = INSTANCE.getHandlersForType(queueItem.type);
  }

  public start(): Flush.WorkerStartResponse {
    return new Promise((resolve, reject) => {
      if (!this.handlers || !this.handlers.length) {
        reject(
          new Error(
            `Must register at least one handler for ${
              this.item.type
            } type of queue item.`
          )
        );
      }
      const handler = this.handlers[this.item.handlerIndex];

      // Succesfully traversed all handlers
      if (!handler) {
        resolve({ ok: true, item: this.item });
      }

      // Handler should only error if coding snafu.
      try {
        handler(this.item);
      } catch {
        // Resolving this way without any item change will trigger lockout.
        resolve({ ok: false, item: this.item });
      }
    });
  }
}
