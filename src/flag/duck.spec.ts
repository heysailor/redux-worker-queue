import 'jest';

import { QueueItem, Queue } from '../queue';
import { addOrUpdateItem, removeItem } from '../queue/duck';
import flag, {
  addOrUpdateFlag,
  removeFlag,
  FlagActionTypes,
  flagsSelector,
  flagByClientMutationIdSelector,
  lockedFlagsSelector,
  workingFlagsSelector,
  haltedFlagsSelector,
  okFlagsSelector,
  clean,
} from './duck';
import { FlagItem } from './flag';
import rootReducer, { __clearQueue__ } from '../duck';
import { Store } from '../types';
import { HandlerPromiseResponse } from '../types';
import { WorkerQueue } from '../main';
import { nextTick } from '../util';

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
  type: FlagActionTypes.ADD_OR_UPDATE_FLAG,
  flag: workingFlagBase,
};

const handler = (item: Queue.Item): Promise<HandlerPromiseResponse> =>
  new Promise((resolve, reject) => resolve({ ok: true, item }));

const handlerType = {
  type: 'PETS',
  handlers: [handler],
};
const workerQueue = new WorkerQueue([handlerType], {
  workers: 2,
});
workerQueue.init();

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
          type: FlagActionTypes.REMOVE_FLAG,
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

  // Set up a state
  const queueItem1 = {
    clientMutationId: 1,
    payload: {},
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
  };
  const queueItem2 = {
    clientMutationId: 2,
    payload: {},
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
  };
  const queueItem3 = {
    clientMutationId: 3,
    payload: {},
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
  };
  const queueItem4 = {
    clientMutationId: 4,
    payload: {},
    type: 'PET',
    errors: [],
    createdAt: new Date().toJSON(),
  };

  const testState: Store.All = {
    queue: [queueItem1, queueItem2, queueItem3, queueItem4],
    flags: [
      new FlagItem(queueItem1, { status: 'WORKING' }),
      new FlagItem(queueItem2, { status: 'OK' }),
      new FlagItem(queueItem3, { status: 'LOCKED' }),
      new FlagItem(queueItem4, { status: 'HALTED' }),
    ],
  };

  describe('Selectors', () => {
    describe('flagsSelector()', () => {
      test('exists', () => {
        expect(flagsSelector).toBeDefined();
      });

      test('it selects all flags', () => {
        const queue = flagsSelector(testState, workerQueue);
        expect(queue).toBeDefined();
        expect(queue.length).toEqual(testState.queue.length);
        expect(queue[0].clientMutationId).toEqual(queueItem1.clientMutationId);
        expect(queue[1].clientMutationId).toEqual(queueItem2.clientMutationId);
      });
    });

    describe('flagByClientMutationIdSelector()', () => {
      test('exists', () => {
        expect(flagByClientMutationIdSelector).toBeDefined();
      });

      test('it selects a flag by its clientMutationId', () => {
        const flag = flagByClientMutationIdSelector(
          testState,
          workerQueue,
          queueItem1.clientMutationId
        );
        expect(flag).toBeDefined();
        expect(flag ? flag.clientMutationId : {}).toEqual(
          queueItem1.clientMutationId
        );
      });
    });

    describe('lockedFlagsSelector()', () => {
      test('exists', () => {
        expect(lockedFlagsSelector).toBeDefined();
      });

      test('it selects only the locked flags', () => {
        const locked = lockedFlagsSelector(testState, workerQueue);
        expect(locked).toBeDefined();
        expect(locked.length).toEqual(1);
        expect(
          locked && locked.length ? locked[0].clientMutationId : {}
        ).toEqual(queueItem3.clientMutationId);
      });
    });

    describe('workingFlagsSelector()', () => {
      test('exists', () => {
        expect(workingFlagsSelector).toBeDefined();
      });

      test('it selects only the working flags', () => {
        const working = workingFlagsSelector(testState, workerQueue);
        expect(working).toBeDefined();
        expect(working.length).toEqual(1);
        expect(
          working && working.length ? working[0].clientMutationId : {}
        ).toEqual(queueItem1.clientMutationId);
      });
    });

    describe('haltedFlagsSelector()', () => {
      test('exists', () => {
        expect(haltedFlagsSelector).toBeDefined();
      });

      test('it selects only the halted flags', () => {
        const halted = haltedFlagsSelector(testState, workerQueue);
        expect(halted).toBeDefined();
        expect(halted.length).toEqual(1);
        expect(
          halted && halted.length ? halted[0].clientMutationId : {}
        ).toEqual(queueItem4.clientMutationId);
      });
    });

    describe('okFlagsSelector()', () => {
      test('exists', () => {
        expect(okFlagsSelector).toBeDefined();
      });

      test('it selects only the halted flags', () => {
        const ok = okFlagsSelector(testState, workerQueue);
        expect(ok).toBeDefined();
        expect(ok.length).toEqual(1);
        expect(ok && ok.length ? ok[0].clientMutationId : {}).toEqual(
          queueItem2.clientMutationId
        );
      });
    });
  });
});
