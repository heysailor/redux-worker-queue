"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
class FlagItem {
    constructor(queueItem, flag) {
        this.handlerIndex = 0;
        this.createdAt = new Date().toJSON();
        if (!flag.status) {
            throw new Error('Must provide flag status');
        }
        // Caution - this will need updating if Flag.ItemStatus changes.
        if (!flag.status.match(/^(WORKING|HALTED|LOCKED|OK)$/)) {
            throw new Error('Flag status must be one of OK, HALTED, LOCKED or WORKING');
        }
        this.clientMutationId = queueItem.clientMutationId;
        this.handlerIndex = flag.handlerIndex || 0;
        this.status = flag.status;
        this.hash = util_1.hash.value(queueItem);
        if (flag) {
            this.lastHash = flag.hash;
        }
        else {
            this.lastHash = undefined;
        }
    }
}
exports.FlagItem = FlagItem;
//# sourceMappingURL=flag.js.map