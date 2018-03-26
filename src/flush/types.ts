import { HandlerPromiseResponse } from '../types';

export declare namespace Flush {
  export type WorkerStartResponse = Promise<HandlerPromiseResponse>;
  export type WorkerRegistration = {
    clientMutationId: ClientMutationId;
    handlerIndex: number;
  };
}
