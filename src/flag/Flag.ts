import { cloneDeep, pick } from 'lodash';
import { ClientMutationId, IQueueItem } from '../item';
import { hash } from '../util';

export interface INewFlag {
  handlerIndex?: number;
  status: 'WORKING' | 'HALTED' | 'LOCKED';
}

export class Flag {
  readonly clientMutationId: ClientMutationId;
  readonly handlerIndex: number = 0;
  readonly status: 'WORKING' | 'HALTED' | 'LOCKED';
  readonly hash: string;
  readonly timestamp: number = getTimestamp();

  constructor(queueItem: IQueueItem, flag: INewFlag) {
    if (!flag.status) {
      throw new Error('Must provide flag status');
    }
    if (
      !(
        flag.status == 'WORKING' ||
        flag.status == 'HALTED' ||
        flag.status == 'LOCKED'
      )
    ) {
      throw new Error('Flag status must be one of HALTED, LOCKED or WORKING');
    }

    this.clientMutationId = queueItem.clientMutationId;
    this.handlerIndex = flag.handlerIndex || 0;
    this.status = flag.status;
    this.hash = getHash(queueItem);
  }
}

function getTimestamp(): number {
  return Math.floor(new Date().getTime() / 1000);
}

function getHash(queueItem: IQueueItem): string {
  return hash.value(queueItem);
}
