import { Reducer } from 'redux';
import { Queue } from './queue/types';
import { Flag } from './flag/types';
import { ActionTypes } from './duck';
import { Store } from './types';

declare global {
  export type ClientMutationId = string | number;
  export type Identified = { clientMutationId: ClientMutationId };
}

export namespace Store {
  export type All = {
    queue: Queue.Store;
    flags: Flag.Store;
  };
}

export type RootSelector = (state: any) => Store.All;

export type Action =
  | __clearQueue__Action
  | Queue.AddOrUpdateItemAction
  | Queue.RemoveItemAction
  | Flag.AddOrUpdateFlagAction
  | Flag.RemoveFlagAction;

export type __clearQueue__Action = {
  type: ActionTypes.__CLEAR__;
};

export type Handler = (item: Queue.Item) => Promise<HandlerPromiseResponse>;
export type HandlersForQueueItemType = {
  [key: string]: Handler[];
};
export type HandlerPromiseResponse = { ok: boolean; item: Queue.Item };

export type RegisterQueueItemTypeInput = {
  type: string;
  handlers: Handler[];
};

export type WorkerQueueSettings = {
  order: {
    by: WorkerQueueOrderBy;
    direction: 'asc' | 'desc';
  };
  workers: number;
  reduxRootSelector?: (externalState: object) => Store.All;
  lockoutPeriod?: number;
};
export type WorkerQueueOrderBy = ('createdAt' | 'clientMutationId')[];
