import { Middleware, MiddlewareAPI, Dispatch, Action } from 'redux';

// This still makes my eyes water.
// https://patrickdesjardins.com/blog/how-to-create-a-typed-redux-middleware-in-typescript
export const middleware: Middleware = <S>(api: MiddlewareAPI<S>) => (
  next: Dispatch<S>
) => <A extends Action>(action: A): A => {
  console.log('Before');
  const result = next(action);
  console.log('After'); // Can use: api.getState()
  return result;
};
