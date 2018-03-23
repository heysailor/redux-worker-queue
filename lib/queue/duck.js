"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const item_1 = require("../item");
const WorkerQueue_1 = require("../WorkerQueue");
const initialState = [];
// See this for a explanation of this approach, including use of 'OTHER'
// https://spin.atomicobject.com/2017/07/24/redux-action-pattern-typescript/
var ActionTypeKeys;
(function (ActionTypeKeys) {
    ActionTypeKeys["ADD_OR_UPDATE_ITEM"] = "__QUEUE__ADD_OR_UPDATE_ITEM";
    ActionTypeKeys["REMOVE_ITEM"] = "__QUEUE__REMOVE_ITEM";
    ActionTypeKeys["__CLEAR__"] = "__QUEUE__CLEAR";
    ActionTypeKeys["OTHER"] = "__any_other_action__";
})(ActionTypeKeys = exports.ActionTypeKeys || (exports.ActionTypeKeys = {}));
function addOrUpdateItem(queueItem) {
    return {
        type: ActionTypeKeys.ADD_OR_UPDATE_ITEM,
        item: new item_1.QueueItem(queueItem),
    };
}
exports.addOrUpdateItem = addOrUpdateItem;
function removeItem(clientMutationId) {
    return { type: ActionTypeKeys.REMOVE_ITEM, clientMutationId };
}
exports.removeItem = removeItem;
function __clearQueue__() {
    return { type: ActionTypeKeys.__CLEAR__ };
}
exports.__clearQueue__ = __clearQueue__;
// Reducers
function queueReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypeKeys.ADD_OR_UPDATE_ITEM: {
            return orderedItemQueue(uniqueItemQueue([action.item, ...state]));
        }
        case ActionTypeKeys.REMOVE_ITEM: {
            return rejectedItemQueue(state, action.clientMutationId);
        }
        case ActionTypeKeys.__CLEAR__: {
            return [];
        }
        default: {
            return state;
        }
    }
}
exports.default = queueReducer;
// Selectors
// Utils - all return new array
const uniqueItemQueue = (queue) => lodash_1.uniqBy(queue, (item) => item.clientMutationId);
const orderedItemQueue = (queue) => lodash_1.orderBy(queue, WorkerQueue_1.INSTANCE.settings.order.by, WorkerQueue_1.INSTANCE.settings.order.direction);
const rejectedItemQueue = (queue, clientMutationId) => lodash_1.reject(queue, (item) => item.clientMutationId === clientMutationId);
//# sourceMappingURL=duck.js.map