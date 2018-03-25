"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const redux_thunk_1 = __importDefault(require("redux-thunk"));
const store_1 = require("./store");
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
exports.middleware = (api) => {
    // Harvest the store.
    // - if middleware used on external store api will be the external store.
    // - if no external store this middleware will load after the first action, and the store will
    //   already have been created internally.
    store_1.initStore(api);
    // return thunk middleware
    return redux_thunk_1.default(api);
};
//# sourceMappingURL=middleware.js.map