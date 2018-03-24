import { Queue } from './queue/types';
import { Flag } from './flag/types';
import { ActionTypes } from './duck';

declare global {
  export type ClientMutationId = string | number;
  export type Identified = { clientMutationId: ClientMutationId };
}

export namespace Store {
  export type All = {
    workerQueue: {
      queue: Queue.Store;
      flag: Flag.Store;
    };
  };
}

export type Action =
  | CleanAction
  | __clearQueue__Action
  | Queue.AddOrUpdateItemAction
  | Queue.RemoveItemAction
  | Flag.AddOrUpdateFlagAction
  | Flag.RemoveFlagAction;

export type __clearQueue__Action = {
  type: ActionTypes.__CLEAR__;
};

export type CleanAction = {
  type: ActionTypes.CLEAN;
};

export type FlushAction = {
  type: ActionTypes.FLUSH;
};

export type Handler = (
  item: Queue.Item
) => Promise<HandlerPromiseResponse | Error>;
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
    direction: WorkerQueueOrderDirection;
  };
  workers: number;
};
export type WorkerQueueOrderBy =
  | ('createdAt' | 'clientMutationId')[]
  | Function;
export type WorkerQueueOrderDirection = 'asc' | 'desc';
