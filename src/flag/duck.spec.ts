import 'jest';
import { QueueItem } from '../item';
import flag, { addOrUpdateFlag, removeFlag, FlagActionTypeKeys } from './duck';
import { __clearQueue__ } from '../duck';

const queueItem = new QueueItem({
  type: 'ITEM',
  payload: {
    satisfaction: 'awesome',
  },
});

const workingFlagBase = {
  clientMutationId: queueItem.clientMutationId,
  handlerIndex: 0,
  status: 'WORKING',
};

const workingFlagActionBase = {
  type: FlagActionTypeKeys.ADD_OR_UPDATE_FLAG,
  flag: workingFlagBase,
};

// Prevents weird jest-only, only-some files error: No reducer provided for key "queue"
// https://stackoverflow.com/a/47311830/2779264
jest.mock('../main'); // ie the redux store

describe('FLAG duck', () => {
  describe('Actions', () => {
    describe('addOrUpdateFlag', () => {
      test('exists', () => {
        expect(addOrUpdateFlag).toBeDefined();
      });

      const workingFlagAction = addOrUpdateFlag(queueItem, {
        status: 'WORKING',
        handlerIndex: 0,
      });

      test('creates an action when provided a QueueItem and settings object', () => {
        expect(workingFlagAction).toMatchObject(workingFlagActionBase);
        expect(workingFlagAction.flag).toMatchObject(workingFlagBase);
      });

      const { flag } = workingFlagAction;
      test('adds a timestamp to the flag ', () => {
        expect(typeof flag.timestamp).toEqual('number');
        expect(flag.timestamp).toBeGreaterThan(0);
      });

      test('adds a hash to the flag ', () => {
        expect(typeof flag.hash).toEqual('string');
        expect(flag.hash.length).toBeGreaterThan(0);
      });

      test('initialises the handlerIndex flag property to 0', () => {
        expect(flag.handlerIndex).toBeDefined();
        expect(flag.handlerIndex).toEqual(0);
      });

      test('strips all other properties', () => {
        const extraProps = {
          clientMutationId: queueItem.clientMutationId,
          handlerIndex: 0,
          status: 'WORKING',
        };
        const shouldBeFine = addOrUpdateFlag(queueItem, {
          blah: 'srgdxc',
          status: 'WORKING',
        });
        expect(shouldBeFine.flag.blah).toBeUndefined();
      });

      test('requires a queueItem to be provided', () => {
        function withoutQueueItemArg() {
          addOrUpdateFlag({}, { status: 'WORKING' });
        }

        expect(withoutQueueItemArg).toThrowError();
      });
      test('requires a status to be provided', () => {
        function withoutSettingsArg() {
          addOrUpdateFlag(queueItem);
        }

        function withoutStatusProp() {
          addOrUpdateFlag(queueItem, { boo: 'bah' });
        }
        expect(withoutSettingsArg).toThrowError();
        expect(withoutStatusProp).toThrowError();
      });

      test('requires a status to be WORKING|HALTED|LOCKED', () => {
        function shouldThrow() {
          addOrUpdateFlag(queueItem, { status: 'bah' });
        }
        expect(shouldThrow).toThrowError();
        expect(
          addOrUpdateFlag(queueItem, { status: 'HALTED' }).flag.status
        ).toEqual('HALTED');
        expect(
          addOrUpdateFlag(queueItem, { status: 'WORKING' }).flag.status
        ).toEqual('WORKING');
        expect(
          addOrUpdateFlag(queueItem, { status: 'LOCKED' }).flag.status
        ).toEqual('LOCKED');
      });
    });

    describe('removeFlag', () => {
      test('it exists', () => {
        expect(removeFlag).toBeDefined();
      });

      test('it throws an error if called with no arguments', () => {
        function shouldError() {
          removeFlag();
        }

        expect(shouldError).toThrowError();
      });

      test('it makes a REMOVE_FLAG action with clientMutationId if called with clientMutationId argument', () => {
        const clientMutationId = 'erg3e';
        expect(removeFlag(clientMutationId)).toMatchObject({
          type: FlagActionTypeKeys.REMOVE_FLAG,
          clientMutationId,
        });
      });
    });
  });

  describe('Reducer', () => {
    test('exists', () => {
      expect(flag).toBeDefined();
    });
    describe('when called with action made with...', () => {
      test(' addOrUpdateItem() --> it adds or updates a flag item', () => {
        const addFirst = addOrUpdateFlag(queueItem, {
          status: 'WORKING',
        });
        const firstState = flag(undefined, addFirst);
        const addSecond = addOrUpdateFlag(queueItem, {
          status: 'WORKING',
          handlerIndex: 2,
        });
        // Update
        const secondState = flag(firstState, addSecond);
        expect(secondState.length).toEqual(1);
        const addThird = addOrUpdateFlag(
          { ...queueItem, clientMutationId: '25we' },
          {
            status: 'WORKING',
            handlerIndex: 2,
          }
        );
        // New queueItem
        const thirdState = flag(secondState, addThird);
        expect(thirdState.length).toEqual(2);
      });
      test('removeItem() --> removes a queue item', () => {
        const addFirst = addOrUpdateFlag(queueItem, {
          status: 'WORKING',
        });
        const firstState = flag(undefined, addFirst);
        expect(firstState.length).toEqual(1);
        const removeAction = removeFlag(firstState[0].clientMutationId);
        const removedState = flag(firstState, removeAction);
        expect(removedState.length).toEqual(0);
      });
      test('__clearQueue__() --> purges the queue', () => {
        const addFirst = addOrUpdateFlag(queueItem, {
          status: 'WORKING',
        });
        const firstState = flag(undefined, addFirst);
        expect(firstState.length).toEqual(1);
        const __clearQueue__Action = __clearQueue__();
        const testState = flag(firstState, __clearQueue__Action);
        expect(testState.length).toEqual(0);
      });
    });
  });
});
