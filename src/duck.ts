import { combineReducers, Reducer } from 'redux';
import { ItemQueue, INSTANCE } from './queue';
import queueReducer, {
  IAddOrUpdateItemAction,
  IRemoveItemAction,
  I__clearQueue__Action,
} from './queue/duck';

// Not mistake - covers unknown actions from other unknown code.
export interface IOtherAction {
  type: '__any_other_action__';
}

export type ActionTypes =
  | IAddOrUpdateItemAction
  | IRemoveItemAction
  | I__clearQueue__Action
  | IOtherAction;

// Allows anything else to come in.
interface StoreEnhancerState {}

export interface IRootState extends StoreEnhancerState {
  queue: ItemQueue;
}

const base = combineReducers({
  queue: queueReducer,
});

const rootReducer: Reducer<IRootState> = combineReducers({
  workerQueue: base,
});

export default rootReducer;
