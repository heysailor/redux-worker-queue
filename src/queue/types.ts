import { QueueActionTypes } from './duck';
import { QueueItem } from './item';

export namespace Queue {
  export type Store = Item[];

  export type ItemErrors = Error[] | object[] | string[];
  export type ItemType = string;

  export type Item = {
    readonly type: ItemType;
    readonly payload: object;
    readonly meta: object;
    readonly errors: ItemErrors;
    readonly clientMutationId: ClientMutationId;
    readonly createdAt: string;
  };

  export type NewItemInput = {
    readonly type: ItemType;
    readonly payload: object;
    readonly meta?: object;
    readonly clientMutationId?: ClientMutationId;
  };

  // Actions

  export type AddOrUpdateItemAction = {
    type: QueueActionTypes.ADD_OR_UPDATE_ITEM;
    item: QueueItem;
  };

  export type RemoveItemAction = {
    type: QueueActionTypes.REMOVE_ITEM;
    clientMutationId: ClientMutationId;
  };
}
