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
      workerAction: 'CREATE',
      type: 'PET',
      payload: myPet,
    });

### _...coming: 4. flush the queue_

## Queue work phases and handler functions

Each queue item is processed in three phases: pre worker, worker, and post worker. You provide a handler function for each phase for when you register a queue item type. The handler functions must return a promise with a specific resolution object as below. A queue item is only removed once the all phases are complete.

### Pre worker: `preWorker` handler

This phase is used to determine which queue items are ready for the worker. The `preWorker` handler for each registered `QueueItem` type is called once per queue flush. If it finds errors, it should place them on the QueueItem.errors array.

It must return a promise which rsesolves to an object, with a new QueueItem:

    {
      valid: Boolean,
      item: QueueItem
    }

### Worker: `worker` handler

In the worker phase, the `worker` handler is called repeatedly valid `QueueItems` of its registered type until it indicates it has successfully completed. If it has errors, it should place them on the QueueItem.errors array - and would indicated it did not complete. Once it is finished, it must save any relevant data (such as an `id`) in QueueItem.workerResult.

It must also return a promise which resolves to an object with a new QueueItem:

    {
       done: Boolean,
       item: QueueItem
    }

### Post worker: `postWorker` handler

The `postWorker` handler is called after the `worker` is finished. It is useful for performing work that depends on the `worker` completing. For instance, persisting relationships between objects, which need the `id` of the saved `QueueItem` payload, as saved in `QueueItem.workerResult`.

It must also return a promise which resolves to an object with a new QueueItem:

    {
       done: Boolean,
       item: QueueItem
    }

Once a `postWorker` handler resolves to an object with `done: true`, the associated `QueueItem` will be regarded as successfully processed, and removed from the queue. Christmas!

## Redux integration

Import the queue middleware to control the queue with redux actions, then apply it in your code:

    import { createStore, applyMiddleware } from 'redux'
    import { Queue, workerQueueMiddleware } from 'redux-worker-queue';

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
      applyMiddleware(workerQueueMiddleware)
    );

    // We want to save Buster!
    const myPet = {
      name: 'Buster',
      panting: true,
    };

    // Add Buster to the queue with a redux action
    const addBusterAction = myQueue.actions.addOrUpdateItem({
      workerAction: 'CREATE',
      type: 'PET',
      payload: myPet,
    });

    // Done!
    store.dispatch(addBusterAction);
