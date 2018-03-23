import { Flag, INewFlag } from './Flag';
import { ActionTypes, GlobalActionTypeKeys } from '../duck';
import { IQueueItem, ClientMutationId } from '../item';
import { uniqueItems, rejectedItems } from '../util';
import { QueueActionTypeKeys } from '../queue';

type FlagQueue = Flag[];

const initialState: FlagQueue = [];

// See this for a explanation of this approach, including use of 'OTHER'
// https://spin.atomicobject.com/2017/07/24/redux-action-pattern-typescript/
export enum FlagActionTypeKeys {
  ADD_OR_UPDATE_FLAG = '__QUEUE__ADD_OR_UPDATE_FLAG',
  REMOVE_FLAG = '__QUEUE__REMOVE_FLAG',
  OTHER = '__any_other_action__',
}

// Add or update queue item

export interface IAddOrUpdateFlag {
  type: FlagActionTypeKeys.ADD_OR_UPDATE_FLAG;
  flag: Flag;
}

export interface IRemoveFlag {
  type: FlagActionTypeKeys.REMOVE_FLAG;
  clientMutationId: ClientMutationId;
}

// Actions

export function addOrUpdateFlag(queueItem: IQueueItem, flag: INewFlag) {
  if (!flag || !flag.status) {
    throw new Error(
      'Must provide a flag with status property as second argument'
    );
  }

  if (!queueItem || !queueItem.clientMutationId || !queueItem.payload) {
    throw new Error('Must provide a queueItem as first argument');
  }

  return {
    type: FlagActionTypeKeys.ADD_OR_UPDATE_FLAG,
    flag: new Flag(queueItem, flag),
  };
}

export function removeFlag(clientMutationId: ClientMutationId) {
  if (!clientMutationId) {
    throw new Error('Must provide a the relevant QueueItem clientMutationId');
  }

  return {
    type: FlagActionTypeKeys.REMOVE_FLAG,
    clientMutationId,
  };
}

// Reducer

export default function flag(
  state: FlagQueue = initialState,
  action: ActionTypes
): FlagQueue {
  switch (action.type) {
    case FlagActionTypeKeys.ADD_OR_UPDATE_FLAG: {
      return uniqueItems([action.flag, ...state]);
    }
    case FlagActionTypeKeys.REMOVE_FLAG: {
      return rejectedItems(state, action.clientMutationId);
    }
    case GlobalActionTypeKeys.__CLEAR__: {
      return initialState;
    }
  }
  return initialState;
}
