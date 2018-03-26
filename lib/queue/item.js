"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const shortid_1 = __importDefault(require("shortid"));
const lodash_1 = require("lodash");
class QueueItem {
    constructor(item) {
        this.type = '';
        this.payload = {};
        this.errors = [];
        this.clientMutationId = shortid_1.default.generate();
        this.createdAt = new Date().toJSON();
        Object.assign(this, lodash_1.pick(lodash_1.cloneDeep(item), Object.keys(this)));
    }
}
exports.QueueItem = QueueItem;
//# sourceMappingURL=item.js.map