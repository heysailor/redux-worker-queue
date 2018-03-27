"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextTick = () => {
    return new Promise(resolve => setTimeout(() => resolve(), 0));
};
//# sourceMappingURL=nextTick.js.map