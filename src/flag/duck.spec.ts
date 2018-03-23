import 'jest';
import { QueueItem } from '../item';
import { addOrUpdateFlag, removeFlag, FlagActionTypeKeys } from './duck';

describe('FLAG duck', () => {
  describe('actions', () => {
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
});
