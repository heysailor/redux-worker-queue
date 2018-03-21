import shortid from 'shortid';

interface IDependencies {
  required: {
    [key: string]: [string | number];
  };
  resolved: {
    [key: string]: [string | number];
  };
}

export interface INewQueueItem {
  readonly type: string;
  readonly payload: object;
  readonly workerAction: string;
  readonly meta?: object;
  readonly dependencies?: IDependencies;
  readonly errors?: Error[] | Object[] | String[];
}

export interface IQueueItem extends INewQueueItem {
  readonly meta: object;
  readonly dependencies: IDependencies;
  readonly errors: Error[] | Object[] | String[];
  readonly clientMutationId: string | number;
  readonly createdAt: string;
}

export class QueueItem implements IQueueItem {
  readonly type = '';
  readonly clientMutationId = shortid.generate();
  readonly createdAt = new Date().toJSON();
  readonly workerAction = '';
  readonly meta = {};
  readonly errors = [];
  readonly payload = {};
  readonly dependencies = {
    required: {},
    resolved: {},
  };

  constructor(item: INewQueueItem | IQueueItem) {
    this.type = item.type || this.type;
    this.payload = { ...(item.payload || this.payload) };
    this.workerAction = item.workerAction || this.workerAction;
    this.meta = { ...(item.meta || this.meta) };
    this.errors = [...(item.errors ? item.errors : this.errors)];
    this.dependencies = {
      resolved: {
        ...((item.dependencies && item.dependencies.resolved) ||
          this.dependencies.resolved),
      },
      required: {
        ...((item.dependencies && item.dependencies.resolved) ||
          this.dependencies.required),
      },
    };
  }
}
