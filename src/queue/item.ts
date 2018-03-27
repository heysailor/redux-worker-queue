import shortid from 'shortid';
import { pick, cloneDeep } from 'lodash';
import { Queue } from './types';

export class QueueItem implements Queue.Item {
  readonly type: string = '';
  readonly payload: object = {};
  readonly errors: Queue.ItemErrors = [];
  readonly clientMutationId: ClientMutationId = shortid.generate();
  readonly createdAt: string = new Date().toJSON();

  constructor(item: Queue.NewItemInput | Queue.Item) {
    const safe = pick(item, Object.keys(this));
    Object.assign(this, { ...safe });
  }
}
