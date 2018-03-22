"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = __importDefault(require("./Queue"));
require("jest");
describe('Queue', () => {
    test('loads', () => {
        expect(Queue_1.default).toBeTruthy();
    });
    const newQueue = new Queue_1.default();
    test('is a class', () => {
        expect(newQueue).toBeInstanceOf(Queue_1.default);
    });
});
describe('Queue item registration function', () => {
    const newQueue = new Queue_1.default();
    test('exists', () => {
        expect(newQueue.registerQueueItemType).toBeTruthy();
    });
    test('returns an error when called with no arguments', () => {
        () => {
            expect(newQueue.registerQueueItemType()).toThrowError(Error);
        };
    });
});
//# sourceMappingURL=Queue.spec.js.map