import { INewQueueItem, IQueueItem, ClientMutationId } from '../item';

// See this for a explanation of this approach
// https://spin.atomicobject.com/2017/07/24/redux-action-pattern-typescript/
export enum ActionTypeKeys {
  ADD_OR_UPDATE_ITEM = '__QUEUE__ADD_OR_UPDATE_ITEM',
  REMOVE_ITEM = '__QUEUE__REMOVE_ITEM',

  SET_ITEM_VALIDATION = '__QUEUE__SET_ITEM_VALIDATION',
  SET_ITEM_ELIGIBILITY = '__QUEUE__SET_ITEM_ELIGIBILITY',
  SET_ITEM_HASH = '__QUEUE__SET_ITEM_HASH',
  SET_ITEM_SAVING = '__QUEUE__SET_ITEM_SAVING',

  CLEANUP = '__QUEUE__CLEANUP',
  REMOVE_ITEM_HASH = '__QUEUE__REMOVE_ITEM_HASH',

  __CLEAR__ = '__QUEUE__CLEAR',

  // Not mistake
  OTHER_ACTION = '__any_other_action_type__',
}

export interface IAddItemAction {
  type: ActionTypeKeys.ADD_OR_UPDATE_ITEM;
  item: IQueueItem;
}

export interface IRemoveItemAction {
  type: ActionTypeKeys.REMOVE_ITEM;
  clientMutationId: ClientMutationId;
}

export interface I__clearQueue__Action {
  type: ActionTypeKeys.__CLEAR__;
}

export interface ICleanupAction {
  type: ActionTypeKeys.CLEANUP;
}

// Not mistake
export interface OtherAction {
  type: ActionTypeKeys.OTHER_ACTION;
}

export type ActionTypes = IAddItemAction;
