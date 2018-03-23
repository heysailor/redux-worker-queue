# Redux Worker WorkerQueue [![Build Status](https://travis-ci.org/heysailor/redux-worker-queue.svg?branch=master)](https://travis-ci.org/heysailor/redux-worker-queue)

_Work in progress, only documented functions operating._

Redux powered queue for the storage and deferred processing of objects of multiple named types. Coordinates the application of per-type custom asynchronous preWorker, worker and postWorker functions. Suited to complex deferred offline persistence handling, eg with validation, saving and linking stages.

Redux powered as standalone module, alternatively use middleware to act on specified actions.

## Quick start

### 1. Initialization

Import the `WorkerQueue` constructor, and initialize the queue.

    import { WorkerQueue } from 'redux-worker-queue';

    // Initialise queue
    const myQueue = new WorkerQueue();

### 2. Register your queue handlers

Call `registerQueueItemType()` with arguments `type` of `QueueItem`, and `preWorker`, `worker` and `postWorker` asynchronous handlers for each phase of the queue process.

    myQueue.registerQueueItemType(
      'PET',
      isMyPetValidAsync,
      saveMyPetAsync,
      linkMyPetsAsync
    )

### 3. Add an item to the queue

Call `addOrUpdateItem()` with a new `payload: {}`,

    const myPet = {
      name: 'Buster',
      panting: true,
    };

    // Add Buster to the queue.
    const bustersQueueItem = myQueue.addOrUpdateItem({
      type: 'PET',
      payload: myPet,
    });

### _...coming: 4. flush the queue_

## WorkerQueue work phases and handler functions

Each queue item is processed in three phases: pre worker, worker, and post worker. You provide a handler function for each phase when you register a queue item type.

The handler functions must return a promise, which should generally resolve as below:

    {
       ok: Boolean,
       item: QueueItem
    }

If the `QueueItem` is now ready for the next phase, this is flagged with `ok: true`. Otherwise, `ok: false` should be passed, _and some form of change made on the `QueueItem`_. For instance, a `preWorker` handler that does validation would probably put its validation errors into `QueueItem.errors` to be shown to a user for action.

If the handler has a critical error, it should reject the promise and pass only the error.

A `QueueItem` will be locked out of processing until it is changed if

* `ok: false` is resolved from the handler promise and no change was made to the `QueueItem`
* a handler promise is rejected with an error

_The only reason the handler promise should reject is a critical error._

A queue item is only processed by the next handler once the preceding handler has resolved to `ok: true`. Once the post worker handler resolves in this way, the item is removed from the queue...Christmas!

## Redux integration

Import the queue middleware to control the queue with redux actions, then apply it in your code:

    import { createStore, applyMiddleware } from 'redux'
    import { WorkerQueue, workerQueueMiddleware } from 'redux-worker-queue';

    import myAwesomeReducer from './reducers';
    import {
      isMyPetValidAsync,
      saveMyPetAsync,
      linkMyPetsAsync
    } from './handlers';

    // Initialise the Worker WorkerQueue as usual
    const workerQueue = new WorkerQueue();

    // Register queue handlers as usual
    myQueue.registerQueueItemType(
      'PET',
      isMyPetValidAsync,
      saveMyPetAsync,
      linkMyPetsAsync
    )

    // Create your store with workerQueueMiddleware applied
    let store = createStore(
      myAwesomeReducer,
      applyMiddleware(workerQueueMiddleware)
    );

    // We want to save Buster!
    const myPet = {
      name: 'Buster',
      panting: true,
    };

    // Add Buster to the queue with a redux action
    const addBusterAction = myQueue.actions.addOrUpdateItem({
      type: 'PET',
      payload: myPet,
    });
    store.dispatch(addBusterAction); // Done!

    // Or, use the queue as without redux middleware,
    // but this time it will use your store.
    const bustersQueueItem = myQueue.addOrUpdateItem({
      type: 'PET',
      payload: myPet,
    }); // Done as well.

## API

### `WorkerQueue:queue` constructor

Called first to initialize the queue. Returns the queue coordinator instance. Allows only one instance to be made.

Takes an optional settings object:

    myQueue = new WorkerQueue({
      order?: {
        by?: 'createdAt|clientMutationId,
        direction?: 'asc'|'desc',
      }
    });

#### `WorkerQueue.registerQueueItemType:void`

Must be called at least once to register a type of `QueueItem` to be placed on the queue, and handlers for that type.

    myQueue.registerQueueItemType(
      type: String,
      preWorker: async Function,
      worker: async Function,
      postWorker: async Function
    )

#### `WorkerQueue.addOrUpdateQueueItem:QueueItem`

Called to add a new item to the queue, or update an existing one. See QueueItem and NewQueueItem.

    myQueue.addOrUpdateQueueItem(
      item: QueueItem | NewQueueItem
    )

#### `WorkerQueue.getHandlersForType:object`

Returns the handlers for the specified `QueueItem` type.

    myQueue.getHandlersForType(
      type: String,
    )

#### `WorkerQueue.order:object`

The ordering settings of the queue.

#### `WorkerQueue.removeItem:void`

Called to remove QueueItem from the queue, as identified by its clientMutationId property.

    myQueue.removeItem(
      clientMutationId: String
    )

#### `WorkerQueue.clearQueue:void`

_Danger!_ Wipes the queue.

    myQueue.clearQueue()

### Data types

These should be treated as immutable.

#### NewQueueItem

Can be used to make a brand new `QueueItem`. If not set, `clientMutationId` is automatically generated.

    NewQueueItem {
      type: String;
      payload: object;
      meta?: object;
      clientMutationId?: string|number;
    }

#### QueueItem

A `QueueItem` is guaranteed to have all these properties. The `createdAt` property cannot be overridden. The `clientMutationId` is the unique identifier.

    QueueItem {
      type: string;
      payload: object;
      meta: object;
      errors: array;
      clientMutationId: string|number;
      createdAt: string;
    }
