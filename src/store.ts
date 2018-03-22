import { IQueueState } from './queue';

// Allows anything else to come in.
interface StoreEnhancerState {}

export interface IRootState extends StoreEnhancerState {
  queue: IQueueState;
}
