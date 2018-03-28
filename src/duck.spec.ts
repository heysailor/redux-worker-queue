import 'jest';
import { __clearQueue__, ActionTypes } from './duck';

describe('WorkerQueue (Global) duck', () => {
  describe('__clearQueue__()', () => {
    test('it exists', () => {
      expect(__clearQueue__).toBeDefined();
    });
    test('it makes an action with CLEAR actionType', () => {
      const action = __clearQueue__();
      expect(action).toMatchObject({
        type: ActionTypes.__CLEAR__,
      });
    });
  });
});
