import { Queue, QueueItem } from '../queue';
import { INSTANCE } from '../WorkerQueue';
import { Handler, HandlerPromiseResponse } from '../types';
import { Flag } from '../flag';
import { Flush } from './types';

export const activeWorkers: Flush.WorkerRegistration[] = [];

export class FlushWorker {
  readonly item: Queue.Item;
  readonly handlers: Handler[];
  readonly flag: Flag.Item;

  constructor(queueItem: Queue.Item, flag: Flag.Item) {
    this.item = queueItem;
    this.flag = flag;
    this.handlers = INSTANCE.getHandlersForType(queueItem.type);
  }

  public async process(): Flush.WorkerStartResponse {
    // console.log(`FlushWorker.process(): called for item`, this.item);

    if (!this.handlers || !this.handlers.length) {
      // reject(
      throw new Error(
        `Must register at least one handler for ${
          this.item.type
        } type of queue item.`
      );
    }
    const handler = this.handlers[this.flag.handlerIndex];

    // Succesfully traversed all handlers
    if (!handler) {
      return { ok: true, item: this.item };
    }

    // Handler should only error if coding snafu. Catch error so there isn't a meltdown.
    try {
      return await handler(this.item);
    } catch (e) {
      if (console && console.error) {
        console.error(
          `Your handler for queued item with clientMutationId ${
            this.item.clientMutationId
          } of type ${
            this.item.type
          } returned an error, which is bad. The error was`,
          e
        );
      }
      // Resolving this way without any item change will trigger lockout.
      return { ok: false, item: this.item };
    }
  }
}
