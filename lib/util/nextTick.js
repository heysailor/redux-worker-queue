"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextTick = () => {
    return new Promise(resolve => resolve()).then();
};
//# sourceMappingURL=nextTick.js.map