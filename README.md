# Redux Worker Queue [![Build Status](https://travis-ci.org/heysailor/redux-worker-queue.svg?branch=master)](https://travis-ci.org/heysailor/redux-worker-queue) [![Coverage Status](https://coveralls.io/repos/github/heysailor/redux-worker-queue/badge.svg?branch=coordinator)](https://coveralls.io/github/heysailor/redux-worker-queue?branch=coordinator)

Redux powered queue for the storage and deferred processing of objects of multiple named types by a specified number of parallel workers. Coordinates the sequential application of per-type custom handler functions. Suited to complex deferred offline persistence handling, eg with validation, saving and linking stages.

Can be used as a standalone module without having to touch redux, alternatively use middleware to join to an external redux store.

## Quick start

### 1. Initialization

Let's save our dog, Buster. Grab the module from npm with `yarn` or `npm`:

    yarn add redux-worker-queue

    npm install --save redux-worker-queue

Import the `WorkerQueue` constructor, and initialize the queue with a `PET` type to handle. The type includes handlers which return a special object.

    import WorkerQueue from 'redux-worker-queue';

    // Initialise queue
    const petType = {
      type: 'PET',
      handlers: [
        isMyPetValidAsync,
        saveMyPetAsync,
      ]
    }
    const myPetsQueue = new WorkerQueue(petType);

    myPetsQueue.init();

### 2. Add an item to the queue

Call `addOrUpdateItem()` with a `NewQueueItem` - specifying the `type` as 'PET', and including Buster's information as the `payload`.

    const myPet = {
      name: 'Buster',
      panting: true,
    };

    // Add Buster to the queue.
    const id = myQueue.addOrUpdateQueueItem({
      type: 'PET',
      payload: myPet,
    });

The Buster `QueueItem` is now stored in the queue.

### 3. Flush the queue at your leisure.

When you're ready, call `flush()`.

    myPetsQueue.flush();

Buster will now be handed to `isMyPetValidAsync`...and if he's valid, to `saveMyPetAsync`...and if that's successful, removed off the queue. Voilà! You've saved him!

## Handlers

The handlers provided to the queue for each type are applied to each `QueueItem` of their specific type, in order of their registration. Each handler can block progression to the next.

The handler functions must be _pure functions_ which take a QueueItem as their first argument, and return a promise. The promise must _always_ resolve as below:

    {
       ok: Boolean,
       item: QueueItem
    }

There are three different pathways from the handler response: OK, halted, locked.

#### OK: Response `{ ok: true, item: possibly changed QueueItem }`

If the `QueueItem` is now ready for the next handler, set `ok: true`. A queue item is only processed by the next handler once the preceding handler has resolved to `ok: true`.

Once the last handler resolves in this way, the item is removed from the queue...Christmas!

#### Halted: Response `{ ok: false, item: a changed QueueItem }`

A halt stops the subsequent handlers being called until the `QueueItem` is updated and `flush()` called again. For example, a validation handler that does validation would probably put its validation errors into `QueueItem.errors` to be shown to a user for action. Update the item by passing the changed `QueueItem` to `addOrUpdateQueueItem()`.

#### Locked: Response `{ ok: false, item: an unchanged QueueItem }`, or a rejected handler promise.

A `QueueItem` will be _locked out_ of processing until it is changed if

* `ok: false` is resolved from the handler promise and no change was made to the `QueueItem`, or
* a handler promise is rejected

_The handler promise should always resolve._ If the handler throws an error or rejects its promise, the `QueueItem` will be locked. The error message is logged to the console, if present, to help you.

## Workers

One or more workers process the queue, applying the correct handler for the QueueItem. The number of concurrent workers can be set in the initialization options or with `WorkerQueue.workers`.

## Redux integration

Import the queue middleware, and add the queue reducers:

    import { createStore, applyMiddleware } from 'redux'
    import WorkerQueue from 'redux-worker-queue';

    import myAwesomeReducer from './reducers';
    import {
      isMyPetValidAsync,
      saveMyPetAsync,
      linkMyPetsAsync
    } from './handlers';

    // Initialise the Worker WorkerQueue as usual, but before using middleware
    const workerQueue = new WorkerQueue({
      type: 'PET',
      handlers: [
        isMyPetValidAsync,
        saveMyPetAsync,
        linkMyPetsAsync
      ]
    });

    // Create your store with a workerQueue key and workerQueue middleware applied
    let store = createStore(
      {
        myState: myAwesomeReducer,
        workerQueue: workerQueue.reducer
      },
      applyMiddleware(workerQueue.middleware)
    );

    // Don't call workerQueue.init().

Use the queue as before, but this time you can also send actions directly:

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

    // Or, use the queue as directly
    const id = myQueue.addOrUpdateQueueItem({
      type: 'PET',
      payload: myPet,
    }); // Done as well.

If you want to use a custom root key, specify it with the `reduxRootSelector` setting:

    // Initialise the WorkerQueue as usual, but passing reduxRootSelector setting
    const workerQueue = new WorkerQueue({
      type: 'PET',
      handlers: [
        isMyPetValidAsync,
        saveMyPetAsync,
        linkMyPetsAsync
      ]
    }, {
      // Add reduxRootSelector to our new root key
      reduxRootSelector: state => state.myAwesomeQueue
    });

    // Create your store the custom queue key
    let store = createStore(
      {
        myState: myAwesomeReducer,

        // Same key as specified in reduxRootSelector
        myAwesomeQueue: workerQueue.reducer,
      },
      applyMiddleware(workerQueue.middleware)
    );

## API

### `WorkerQueue:queue` constructor

Call `new WorkerQueue()` to obtain the queue instance. Allows only one instance to be made.

Takes a single `TypeRegistration` or array of `TypeRegistration` objects, and an optional `Settings` object.

    const myQueue = new WorkerQueue(TypeRegistraton|[TypeRegistration],Settings?);

### `WorkerQueue.init()`

Initialises the queue. Internally, redux is used, and this sets up the store. Call immediately after obtaining the queue instance and before adding any items to the queue. Omit if using external redux integration.

#### `WorkerQueue.registerQueueItemType():void`

Takes a single `TypeRegistration` object to register a type of `QueueItem`, and handlers for that type. Use if you need to add a `QueueItem` type after initialising the queue.

    myQueue.registerQueueItemType(TypeRegistration)

#### `WorkerQueue.addOrUpdateQueueItem():ClientMutationId`

Called to add a new item to the queue, or update an existing one. Returns the `ClientMutationId` of the `QueueItem`.

    myQueue.addOrUpdateQueueItem(
      item: QueueItem | NewQueueItem
    )

#### `WorkerQueue.getItem(id: ClientMutationId): Promise<QueueItem|undefined>`

Take the `ClientMutationId` of a `QueueItem`. Returns a promise, resolving to a copy of `QueueItem` from the queue, or `undefined` if not found.

    myQueue.getItem(
      id: ClientMutationId
    )

#### `WorkerQueue.getHandlersForType():object`

Returns the handlers for the specified `QueueItem` type.

    myQueue.getHandlersForType(type: String)

#### `WorkerQueue.removeItem(id: ClientMutationId):void`

Called to remove `QueueItem` from the queue, as identified by its `ClientMutationId`.

    myQueue.removeItem(clientMutationId: string)

#### `WorkerQueue.clearQueue():void`

_Danger!_ Wipes the queue.

    myQueue.clearQueue()

#### `WorkerQueue.order:object`

Returns the ordering settings of the queue.

#### `WorkerQueue.workers:number`

Set this to the number of workers required.

### Data types

#### `type: TypeRegistration`

    {
      type: string,
      handlers: [
        (item: QueueItem): Promise<{ ok: boolean, item: QueueItem }>
      ]
    }

#### `type: Settings`

    {
      workers?: number
    }

#### `type: NewQueueItem`

Can be used to make a brand new `QueueItem`. If not set, `clientMutationId` is automatically generated.

    NewQueueItem {
      type: String;
      payload: object;
      clientMutationId?: string|number;
    }

#### `type: QueueItem`

A `QueueItem` is guaranteed to have all these properties. The `createdAt` property cannot be overridden. The `clientMutationId` is the unique identifier.

    QueueItem {
      type: string;
      payload: object;
      errors: array;
      clientMutationId: ClientMutationId;
      createdAt: ISO-8601 date string;
    }

#### `ClientMutationId`

All `QueueItem` objects on the queue are identified with a `clientMutationId` property, which is autogenerated if not provided on creation. It's a number or alphanumeric string.

    ClientMutationId: string|number
