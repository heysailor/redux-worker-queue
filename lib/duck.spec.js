"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const duck_1 = require("./duck");
// Prevents weird jest-only, only-some files error: No reducer provided for key "queue"
// https://stackoverflow.com/a/47311830/2779264
jest.mock('./main'); // ie the redux store
describe('WorkerQueue (Globale) duck', () => {
    describe('__clearQueue__()', () => {
        test('it exists', () => {
            expect(duck_1.__clearQueue__).toBeDefined();
        });
        test('it makes an action with CLEAR actionType', () => {
            const action = duck_1.__clearQueue__();
            expect(action).toMatchObject({
                type: duck_1.ActionTypes.__CLEAR__,
            });
        });
    });
    describe('clean()', () => {
        test('it exists', () => {
            expect(duck_1.clean).toBeDefined();
        });
        test('it makes an action with CLEAN actionType', () => {
            const action = duck_1.clean();
            expect(action).toMatchObject({
                type: duck_1.ActionTypes.CLEAN,
            });
        });
    });
});
//# sourceMappingURL=duck.spec.js.map