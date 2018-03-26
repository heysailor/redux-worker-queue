import 'jest';
import { __clearQueue__, ActionTypes } from './duck';

// Prevents weird jest-only, only-some files error: No reducer provided for key "queue"
// https://stackoverflow.com/a/47311830/2779264
// jest.mock('./main'); // ie the redux store

describe('WorkerQueue (Globale) duck', () => {
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
