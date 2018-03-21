import shortid from 'shortid';
import { cloneDeep } from 'lodash';

interface IDependencies {
  required: {
    [key: string]: ClientMutationId;
  };
  resolved: {
    [key: string]: ClientMutationId;
  };
}

export type ItemType = string;

export type ClientMutationId = string | number;
type ItemErrors = Error[] | Object[] | String[];

export interface INewQueueItem {
  readonly type: ItemType;
  readonly payload: object;
  readonly workerAction: string;
  readonly meta?: object;
  readonly dependencies?: IDependencies;
  readonly errors?: ItemErrors;
}

export interface IQueueItem {
  readonly type: ItemType;
  readonly payload: object;
  readonly workerAction: string;
  readonly meta: object;
  readonly dependencies: IDependencies;
  readonly errors: ItemErrors;
  readonly clientMutationId: ClientMutationId;
  readonly createdAt: string;
}

export class QueueItem implements IQueueItem {
  readonly type: ItemType = '';
  readonly payload: object = {};
  readonly workerAction: string = '';
  readonly meta: object = {};
  readonly dependencies: IDependencies = {
    resolved: {},
    required: {},
  };
  readonly errors: ItemErrors = [];
  readonly clientMutationId: ClientMutationId = shortid.generate();
  readonly createdAt: string = new Date().toJSON();

  constructor(item: INewQueueItem | IQueueItem) {
    Object.assign(this, cloneDeep(item));
  }
}
