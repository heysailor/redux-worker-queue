import shortid from 'shortid';
import { Queue } from './types';

export class QueueItem implements Queue.Item {
  readonly type: string = '';
  readonly payload: object = {};
  readonly errors: Queue.ItemErrors;
  readonly clientMutationId: ClientMutationId = shortid.generate();
  readonly createdAt: string = new Date().toJSON();

  constructor(item: Queue.NewItemInput | Queue.Item) {
    this.type = item.type;
    this.payload = { ...item.payload };
    this.errors =
      <Queue.Item>item && (<Queue.Item>item).errors
        ? [...(<Queue.Item>item).errors]
        : [];
    this.clientMutationId = item.clientMutationId || this.clientMutationId;
    this.createdAt =
      <Queue.Item>item && (<Queue.Item>item).createdAt
        ? (<Queue.Item>item).createdAt
        : this.createdAt;
  }
}
