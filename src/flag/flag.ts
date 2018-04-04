import { cloneDeep, pick } from 'lodash';
import { Flag } from './types';
import { Queue } from '../queue';
import { hash } from '../util';

export class FlagItem implements Flag.Item {
  readonly clientMutationId: ClientMutationId;
  readonly handlerIndex: number = 0;
  readonly status: Flag.ItemStatus;
  readonly hash: string;
  readonly lastHash: string | undefined;
  readonly createdAt: string = new Date().toJSON();
  readonly updatedAt: string | undefined;

  constructor(queueItem: Queue.Item, flag: Flag.Item | Flag.NewItemInput) {
    if (!flag.status) {
      throw new Error('Must provide flag status');
    }
    // Caution - this will need updating if Flag.ItemStatus changes.
    if (!flag.status.match(/^(WORKING|HALTED|LOCKED|OK)$/)) {
      throw new Error(
        'Flag status must be one of OK, HALTED, LOCKED or WORKING'
      );
    }

    this.clientMutationId = queueItem.clientMutationId;
    this.handlerIndex = flag.handlerIndex || 0;
    this.status = flag.status;
    this.hash = hash.value(queueItem);

    if (<Flag.Item>flag) {
      this.lastHash = (<Flag.Item>flag).hash;
      this.updatedAt = new Date().toJSON();
    } else {
      this.lastHash = undefined;
      this.updatedAt = undefined;
    }
  }
}
