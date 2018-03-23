"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
// Todo - enable listening to external redux actions when plugged in with this middleware.
// This still makes my eyes water.
// https://patrickdesjardins.com/blog/how-to-create-a-typed-redux-middleware-in-typescript
exports.middleware = (api) => (next) => (action) => {
    main_1.replaceStore(api);
    main_1.store.dispatch(action);
    const result = next(action);
    return result;
};
//# sourceMappingURL=middleware.js.map