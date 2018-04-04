import { FlagActionTypes } from './duck';

export namespace Flag {
  export type Item = {
    readonly clientMutationId: ClientMutationId;
    readonly handlerIndex: number;
    readonly status: ItemStatus;
    readonly hash: string;
    readonly lastHash: string | undefined;
    readonly createdAt: string;
    readonly updatedAt: string | undefined;
  };

  export type NewItemInput = {
    handlerIndex?: number;
    status: ItemStatus;
  };

  export type ItemStatus = 'WORKING' | 'HALTED' | 'LOCKED' | 'OK';

  export type Store = Item[];

  export type AddOrUpdateFlagAction = {
    type: FlagActionTypes.ADD_OR_UPDATE_FLAG;
    flag: Item;
  };

  export type RemoveFlagAction = {
    type: FlagActionTypes.REMOVE_FLAG;
    clientMutationId: ClientMutationId;
  };
}
