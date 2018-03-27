"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const WorkerQueue_1 = require("../WorkerQueue");
// All return new array
function uniqueItems(items) {
    return lodash_1.uniqBy(items, (item) => item && item.clientMutationId);
}
exports.uniqueItems = uniqueItems;
// Uses settings from WorkerQueue instance
function orderedItems(items) {
    return lodash_1.orderBy(items, WorkerQueue_1.INSTANCE.settings.order.by, WorkerQueue_1.INSTANCE.settings.order.direction);
}
exports.orderedItems = orderedItems;
// Rejects by clientMutationId
function rejectedItems(items, clientMutationId) {
    return lodash_1.reject(items, (item) => item.clientMutationId === clientMutationId);
}
exports.rejectedItems = rejectedItems;
//# sourceMappingURL=collections.js.map