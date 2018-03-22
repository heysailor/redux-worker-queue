import { Middleware, MiddlewareAPI, Dispatch, Action } from 'redux';
import { store, replaceStore } from './main';

// Todo - enable listening to external redux actions when plugged in with this middleware.
// This still makes my eyes water.
// https://patrickdesjardins.com/blog/how-to-create-a-typed-redux-middleware-in-typescript
export const middleware: Middleware = <S>(api: MiddlewareAPI<S>) => (
  next: Dispatch<S>
) => <A extends Action>(action: A): A => {
  replaceStore(api);
  store.dispatch(action);
  const result = next(action);
  return result;
};
