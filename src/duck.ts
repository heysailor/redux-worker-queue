import { combineReducers, Reducer } from 'redux';
import { ItemQueue } from './queue';
import queue, { IAddOrUpdateItemAction, IRemoveItemAction } from './queue/duck';
import flag, { IAddOrUpdateFlag, IRemoveFlag } from './flag/duck';

// Not mistake - covers unknown actions from other unknown code.
export interface IOtherAction {
  type: '__any_other_action__';
}

export enum GlobalActionTypeKeys {
  __CLEAR__ = '__WORKER_QUEUE__CLEAR__',
}

export type ActionTypes =
  | IAddOrUpdateItemAction
  | IRemoveItemAction
  | I__clearQueue__Action
  | IAddOrUpdateFlag
  | IRemoveFlag
  | IOtherAction;

// Allows anything else to come in.
interface StoreEnhancerState {}

// Actions
// Wipe queue  ## DANGER ZONE ##

export interface I__clearQueue__Action {
  type: GlobalActionTypeKeys.__CLEAR__;
}

export function __clearQueue__(): I__clearQueue__Action {
  return { type: GlobalActionTypeKeys.__CLEAR__ };
}

export interface IRootState extends StoreEnhancerState {
  queue: Reducer<ItemQueue>;
}

const workerQueue: Reducer<IRootState> = combineReducers({
  queue,
});

export default workerQueue;
