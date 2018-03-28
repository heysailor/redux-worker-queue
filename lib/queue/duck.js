"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const item_1 = require("./item");
const util_1 = require("../util");
const duck_1 = require("../duck");
const WorkerQueue_1 = require("../WorkerQueue");
const store_1 = require("../store");
var QueueActionTypes;
(function (QueueActionTypes) {
    QueueActionTypes["ADD_OR_UPDATE_ITEM"] = "__QUEUE__ADD_OR_UPDATE_ITEM";
    QueueActionTypes["REMOVE_ITEM"] = "__QUEUE__REMOVE_ITEM";
})(QueueActionTypes = exports.QueueActionTypes || (exports.QueueActionTypes = {}));
// Add or update queue item. Entry to using queue.
// Ensures store initialisation.
function addOrUpdateItem(queueItem) {
    return {
        type: QueueActionTypes.ADD_OR_UPDATE_ITEM,
        item: new item_1.QueueItem(queueItem),
    };
}
exports.addOrUpdateItem = addOrUpdateItem;
// Remove queue item
exports.removeItem = (clientMutationId) => {
    return {
        type: QueueActionTypes.REMOVE_ITEM,
        clientMutationId,
    };
};
// Reducer
function queueReducer(state = [], action) {
    switch (action.type) {
        case QueueActionTypes.ADD_OR_UPDATE_ITEM: {
            return util_1.orderedItems(util_1.uniqueItems([action.item, ...state]));
        }
        case QueueActionTypes.REMOVE_ITEM: {
            return util_1.rejectedItems(state, action.clientMutationId);
        }
        case duck_1.ActionTypes.__CLEAR__: {
            return [];
        }
        default: {
            return state;
        }
    }
}
exports.default = queueReducer;
// Selectors
exports.queueSelector = (state, workerQueueInstance) => store_1.rootSelector(state, workerQueueInstance).queue;
exports.queueItemByClientMutationIdSelector = (state, clientMutationId) => lodash_1.find(exports.queueSelector(state, WorkerQueue_1.INSTANCE), { clientMutationId });
//# sourceMappingURL=duck.js.map