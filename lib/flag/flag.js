"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
class FlagItem {
    constructor(queueItem, flag) {
        this.handlerIndex = 0;
        this.timestamp = util_1.getTimestamp();
        if (!flag.status) {
            throw new Error('Must provide flag status');
        }
        // Caution - this will need updating if Flag.ItemStatus changes.
        if (!flag.status.match(/^(WORKING|HALTED|LOCKED)$/)) {
            throw new Error('Flag status must be one of HALTED, LOCKED or WORKING');
        }
        this.clientMutationId = queueItem.clientMutationId;
        this.handlerIndex = flag.handlerIndex || 0;
        this.status = flag.status;
        this.hash = util_1.hash.value(queueItem);
    }
}
exports.FlagItem = FlagItem;
//# sourceMappingURL=flag.js.map