import shortid from 'shortid';
import { cloneDeep, pick } from 'lodash';

export type ItemType = string;

export type ClientMutationId = string | number;
type ItemErrors = Error[] | Object[] | String[];

export interface IItem {
  clientMutationId: ClientMutationId;
}

export interface INewQueueItem {
  readonly type: ItemType;
  readonly payload: object;
  readonly meta?: object;
  readonly clientMutationId?: ClientMutationId;
}

export interface IQueueItem extends IItem {
  readonly type: ItemType;
  readonly payload: object;
  readonly meta: object;
  readonly errors: ItemErrors;
  readonly clientMutationId: ClientMutationId;
  readonly createdAt: string;
}

export class QueueItem implements IQueueItem {
  readonly type: ItemType = '';
  readonly payload: object = {};
  readonly meta: object = {};
  readonly errors: ItemErrors = [];
  readonly clientMutationId: ClientMutationId = shortid.generate();
  readonly createdAt: string = new Date().toJSON();

  constructor(item: INewQueueItem | IQueueItem) {
    Object.assign(this, pick(cloneDeep(item), Object.keys(this)));
  }
}
