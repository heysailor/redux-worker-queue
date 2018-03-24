import { cloneDeep, pick } from 'lodash';
import { Flag } from './types';
import { Queue } from '../queue';
import { hash, getTimestamp } from '../util';

export class FlagItem implements Flag.Item {
  readonly clientMutationId: ClientMutationId;
  readonly handlerIndex: number = 0;
  readonly status: Flag.ItemStatus;
  readonly hash: string;
  readonly timestamp: number = getTimestamp();

  constructor(queueItem: Queue.Item, flag: Flag.NewItemInput) {
    if (!flag.status) {
      throw new Error('Must provide flag status');
    }
    // Caution - this needs updating if Flag.ItemStatus changes.
    if (!flag.status.match(/^(WORKING|HALTED|LOCKED)$/)) {
      throw new Error('Flag status must be one of HALTED, LOCKED or WORKING');
    }

    this.clientMutationId = queueItem.clientMutationId;
    this.handlerIndex = flag.handlerIndex || 0;
    this.status = flag.status;
    this.hash = hash.value(queueItem);
  }
}
