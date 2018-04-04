"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const shortid_1 = __importDefault(require("shortid"));
class QueueItem {
    constructor(item) {
        this.type = '';
        this.payload = {};
        this.clientMutationId = shortid_1.default.generate();
        this.createdAt = new Date().toJSON();
        this.type = item.type;
        this.payload = Object.assign({}, item.payload);
        this.errors =
            item && item.errors
                ? [...item.errors]
                : [];
        this.clientMutationId = item.clientMutationId || this.clientMutationId;
        this.createdAt =
            item && item.createdAt
                ? item.createdAt
                : this.createdAt;
        this.updatedAt =
            item && item.createdAt
                ? new Date().toJSON()
                : undefined;
    }
}
exports.QueueItem = QueueItem;
//# sourceMappingURL=item.js.map