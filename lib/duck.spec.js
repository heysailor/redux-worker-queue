"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const duck_1 = require("./duck");
describe('WorkerQueue (Global) duck', () => {
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
});
//# sourceMappingURL=duck.spec.js.map