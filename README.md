# Redux Worker WorkerQueue [![Build Status](https://travis-ci.org/heysailor/redux-worker-queue.svg?branch=master)](https://travis-ci.org/heysailor/redux-worker-queue)

_Work in progress, only documented functions operating._

Redux powered queue for the storage and deferred processing of objects of multiple named types. Coordinates the application of per-type custom handler functions. Suited to complex deferred offline persistence handling, eg with validation, saving and linking stages.

Redux powered as standalone module, alternatively use middleware to act on specified actions.

## Quick start

### 1. Initialization

Import the `WorkerQueue` constructor, and initialize the queue with a type to handle.

    import { WorkerQueue } from 'redux-worker-queue';

    // Initialise queue
    const petType = {
      type: 'PET',
      handlers: [
        isMyPetValidAsync,
        saveMyPetAsync,
      ]
    }
    const myQueue = new WorkerQueue(petType);

### 2. Add an item to the queue

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

### _...coming: 3. flush the queue_

## Handlers

The handlers provided to the queue for each type are applied a the QueueItem in order of their registration. Each handler can block progression to the next.

The handler functions must take a QueueItem as their sole argument, and return a promise, which should generally resolve as below:

    {
       ok: Boolean,
       item: QueueItem
    }

If the `QueueItem` is now ready for the next handler, this is flagged with `ok: true`. Otherwise, `ok: false` should be passed, _and some form of change made on the `QueueItem`_. For example, a validation handler that does validation would probably put its validation errors into `QueueItem.errors` to be shown to a user for action.

If the handler has a critical error, it should reject the promise and pass only the error.

A `QueueItem` will be _locked out_ of processing until it is changed if

* `ok: false` is resolved from the handler promise and no change was made to the `QueueItem`, or
* a handler promise is rejected with an error

_The only reason the handler promise should reject is a critical error._

A queue item is only processed by the next handler once the preceding handler has resolved to `ok: true`. Once the last handler resolves in this way, the item is removed from the queue...Christmas!

## Workers

One or more workers process the queue, applying the correct handler for the QueueItem. The number of concurrent workers can be set in the initialization options or with `WorkerQueue.workers`.

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

Takes a single `TypeRegistration` or array of `TypeRegistration` objects, and an optional `Settings` object.

    const myQueue = new WorkerQueue(TypeRegistraton|[TypeRegistration],Settings?);

#### `WorkerQueue.registerQueueItemType():void`

Takes a single `TypeRegistration` object to register a type of `QueueItem`, and handlers for that type.

    myQueue.registerQueueItemType(TypeRegistration)

#### `WorkerQueue.addOrUpdateQueueItem():QueueItem`

Called to add a new item to the queue, or update an existing one. See QueueItem and NewQueueItem.

    myQueue.addOrUpdateQueueItem(
      item: QueueItem | NewQueueItem
    )

#### `WorkerQueue.getHandlersForType():object`

Returns the handlers for the specified `QueueItem` type.

    myQueue.getHandlersForType(type: String)

#### `WorkerQueue.removeItem():void`

Called to remove `QueueItem` from the queue, as identified by its clientMutationId property.

    myQueue.removeItem(clientMutationId: string)

#### `WorkerQueue.clearQueue():void`

_Danger!_ Wipes the queue.

    myQueue.clearQueue()

#### `WorkerQueue.order:object`

The ordering settings of the queue.

#### `WorkerQueue.workers:number`

Set this to the number of workers required.

### Data types

#### `TypeRegistration`

    {
      type: string,
      handlers: [
        Function<Promise>,
      ]
    }

#### `Settings`

    {
      order?: {
        by?: 'createdAt|clientMutationId,
        direction?: 'asc'|'desc',
      }
      workers?: number
    }

#### `NewQueueItem`

Can be used to make a brand new `QueueItem`. If not set, `clientMutationId` is automatically generated.

    NewQueueItem {
      type: String;
      payload: object;
      meta?: object;
      clientMutationId?: string|number;
    }

#### `QueueItem`

A `QueueItem` is guaranteed to have all these properties. The `createdAt` property cannot be overridden. The `clientMutationId` is the unique identifier.

    QueueItem {
      type: string;
      payload: object;
      meta: object;
      errors: array;
      clientMutationId: string|number;
      createdAt: string;
    }
