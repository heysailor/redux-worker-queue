# Redux Worker Queue

_Work in progress, only documented functions operating._

Redux powered queue for the storage and deferred processing of objects of multiple named types. Coordinates the application of per-type custom asynchronous preWorker, worker and postWorker functions. Suited to complex deferred offline persistence handling, eg with validation, saving and linking stages.

Redux powered as standalone module, alternatively use middleware to act on specified actions.

## Quick start

### 1. Initialization

Import the Queue constructor, and initialize with an optional settings.

    import { Queue } from 'redux-worker-queue';

    // Initialise queue
    const myQueue = new Queue();

### 2. Register your queue handlers

Call `registerQueueItemType()` with a `preWorker`, `worker` and `postWorker` as asynchronous `QueueItem` handlers for each `type` of object that will be on the queue.

    myQueue.registerQueueItemType(
      type: 'PET',
      preWorker: isMyPetValidAsync,
      worker: saveMyPetAsync,
      postWorker: linkMyPetsAsync
    )

### 3. Add an item to the queue

Call `addOrUpdateItem()` with a new `payload: {}`,

    const myPet = {
      name: 'Buster',
      panting: true,
    };

    // Add Buster to the queue.
    const queued = myQueue.addOrUpdateItem({
      type: 'PET',
      payload: myPet,
    });

### _...coming: 4. flush the queue_

## Queue work phases and handler functions

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
    import { Queue, getWorkerQueueMiddleware } from 'redux-worker-queue';

    import myAwesomeReducer from './reducers';
    import {
      isMyPetValidAsync,
      saveMyPetAsync,
      linkMyPetsAsync
    } from './handlers';

    // Initialise the Worker Queue as usual
    const workerQueue = new Queue();

    // Register queue handlers as usual
    myQueue.registerQueueItemType(
      type: 'PET',
      preWorker: isMyPetValidAsync,
      worker: saveMyPetAsync,
      postWorker: linkMyPetsAsync
    )

    // Create your store with workerQueueMiddleware applied
    let store = createStore(
      myAwesomeReducer,
      applyMiddleware(getWorkerQueueMiddleware())
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

    // Done!
    store.dispatch(addBusterAction);
