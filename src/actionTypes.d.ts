import {
  IAddOrUpdateItemAction,
  IRemoveItemAction,
  I__clearQueue__Action,
  ICleanupAction,
} from './queue/duck';

// Not mistake - covers unknown actions from other unknown code.
export interface IOtherAction {
  type: '__any_other_action__';
}

export type ActionTypes =
  | IAddOrUpdateItemAction
  | IRemoveItemAction
  | I__clearQueue__Action
  | ICleanupAction
  | IOtherAction; //?is this needed
