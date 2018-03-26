import { Middleware, MiddlewareAPI, Dispatch, Action } from 'redux';
import thunk from 'redux-thunk';
import { initStore } from './store';

// Really just including middleware for future proofing.
// This still makes my eyes water.
// https://patrickdesjardins.com/blog/how-to-create-a-typed-redux-middleware-in-typescript
// export const middleware: Middleware = <S>(api: MiddlewareAPI<S>) => (
//   next: Dispatch<S>
// ) => <A extends Action>(action: A): A => {
//   const result = next(action);
//   return result;
// };

// Half middleware! Really just a layer over thunk.
export const middleware: Middleware = <S>(api: MiddlewareAPI<S>) => {
  // Harvest the store.
  // - if middleware used on external store api will be the external store.
  // - if no external store this middleware will load after the first action, and the store will
  //   already have been created internally.
  initStore(api);

  // return thunk middleware
  return thunk(api);
};
