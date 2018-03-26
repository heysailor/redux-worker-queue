import { HandlerPromiseResponse } from '../types';

export declare namespace Flush {
  export type ActiveWorker = {
    clientMutationId: ClientMutationId;
  };
  export type WorkerStartResponse = Promise<HandlerPromiseResponse>;
}
