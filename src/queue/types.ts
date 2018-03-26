import { QueueActionTypes } from './duck';

export namespace Queue {
  export type Store = Item[];

  export type ItemErrors = Error[] | object[] | string[];
  export type ItemType = string;

  export type Item = {
    readonly type: ItemType;
    readonly payload: object;
    readonly errors: ItemErrors;
    readonly clientMutationId: ClientMutationId;
    readonly createdAt: string;
  };

  export type NewItemInput = {
    readonly type: ItemType;
    readonly payload: object;
    readonly clientMutationId?: ClientMutationId;
  };

  // Actions

  export type AddOrUpdateItemAction = {
    type: QueueActionTypes.ADD_OR_UPDATE_ITEM;
    item: Item;
  };

  export type RemoveItemAction = {
    type: QueueActionTypes.REMOVE_ITEM;
    clientMutationId: ClientMutationId;
  };
}
