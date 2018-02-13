# @swatk6/emitter

A drop-in replacement for EventEmitter that can handle DOM-style events whose propagation can be stopped.

This module exports two classes: `emitter` and `event`. The `emitter` can be used as a basis for `extend`ing your own class, and the `event` class can be used by itself or be extended to serve your needs for an in-transit cancelable event.

From version 1.1.0 onwards, the `emitter` class also comes with a parent-child architecture that allows for event traversal along the hierarchy tree.

## Usage

`npm install --save @swatk6/emitter`

```javascript
const myemitter = require('@swatk6/emitter').emitter;
const myevent = require('@swatk6/emitter').event;

class MyEmitterClass extends myemitter {
  constructor() {
    super();
  }
}
```

For a detailed example, see test.js in this package.

## Reference

### Event traversal

1. `event` objects are emitted by `emitter` objects.
2. `emitter` objects can be chained up in a parent/children relationship, and thus forming a propagation tree.
3. `emitter` objects can be set up to emit events locally, sideways (siblings), upwards (parents) and downwards (children). The path and order of emitting is configurable.
4. `event` objects can be set up to be either allowed or disallowed to travel in certain directions.
5. `event` objects can also be set up to "saturate" the emitter tree.
6. Non-saturating events can only be emitted locally, and can travel sideways, stright up the parental chain, and downwards to all children, 
relative to the `emitter` they were emitted at. When in non-saturating mode, when an `emitter` in the propagation chain is called to emit an `event`, 
it will only do so locally.
7. "Saturating" events will be fired on all connected `emitter`s on a tree, regardless of direct lineage. The order of emission is:
  - first the event is emitted on the `emitter` object where it was fired at (the *origin* emitter);
  - then it is emitted on the siblings of the *origin*;
  - then on all of the children of the *origin* (recursively down to the last items in the tree);
  - then on all of the children of the *origin*'s siblings (recursively, of course);
  - then it is emitted on the direct parent of the *origin*;
  - then on all of the siblings of the direct parent of *origin*;
  - then on all the children of the siblings of the direct parent of *origin*, recursively, down to all of their children;
  - then recursively upward on the parent of the direct parent of the origin, and those parents' siblings as well, and so on.
8. An `event`'s propagation can be stopped at any time. `event.stopPropagation()` will allow the event 
to finish up calling listeners on the current `emitter` before canceling the event propagation to other `emitter`s.
`event.stopImmediatePropagation()` will cancel the propagation right away.
9. `event.eventPhase` reflects on which propagation phase the event is currently in. In the case of "saturating" events, it is either _LOCAL or _SATURATING.
10. `event.target` is optionally filled by whatever object is creating the event object. `event.currentTarget` is always updated by the `emitter` that currently
emits the event. There is no `event.deepPath` as I'm afraid it might lead to circular reference hell.*

* However, if you think it'd be a good idea, voice your opinion in the Issues of this package on GitHub.

### `emitter`

#### Static properties

`defaultFirstDirection` = `event.PROPAGATES_LOCAL`
`defaultSecondDirection` = `event.PROPAGATES_DOWN`
`defaultThirdDirection` = `event.PROPAGATES_UP`
`defaultThirdDirection` = `event.PROPAGATES_NONE`

If you use the parent/child hierarchy extension, these constants set up the default behaviour of all created emitter objects.
This setting describes a setup where the emitted `eventObject` first propagates locally (to the listeners of the emitter instance),
then to the emitter object's siblings if any, then to the emitter object's children, if any (where they are propagated locally), and their children, recursively. Once that
propagation is done, the same `eventObject` then is propagated to the original emitter's parent where it once again propagates
locally, then, if it is allowed, proceeds upwards to the parent's parent, recursively.

If all four directions are traversed, an event only finishes propagating when:
- all local-level listeners are called;
- *and* all children of the local emitter are called, and theirs, recursively, until the deepermost children are emitted;
- *and* the whole of the local emitter's parental chain is called;
- *or* the event is specified either not to traverse certain directions, or is cancelled by one of the listeners.

Bear in mind, that event traversal at the moment* is a sync operation, therefore it may block your entire process if written carelessly.

`defaultMaxListeners` = `0`

This is left in only for compatibility reasons, it does not have any effect on the classes' operations.

*: Yes, that means I'm working on an async event emission solution, but there's no ETA on that yet.

#### As a drop-in-replacement for NodeJS's EventEmitter

This class provides a drop-in replacement functionality for Node's official `EventEmitter` class. It's API-compatible for the most part, but it has a few subtle differences.

- It does not care about maximum listener counts (it's just an excuse to tolerate bad programming).
- The class internals look decidedly different from the official `EventEmitter` implementation, so any hacks building on interals abuse will not work.
- This class does not optimize for single listeners (which are done without an `Array` in the official implementation), so it might lose a few cycles when compared to the original.**
- Neither does it optimize for single or multiple arguments; the algorithm I used for extracting arguments is one that avoids that famed V8 slowdown bug.**
- It supports an object-based (`.event`) event approach that allows for payload and result distribution among listeners (allowing the use of events for dynamically configurable filters and data modifiers) and cancelable events (that stop any subsequent listeners to be called).

**: If you experience significant slowdowns because of these optimization omissions, let me know in an issue and I'll reintroduce them to the codeline.

##### Methods

`addListener(eventName,listener)`
`on(eventName,listener)`
- **eventName** `<String>`: the event name for which to register this listener
- **listener** `<Function>`: a function that will be called
- returns the emitter object itself, allowing for chaining

`emit(eventName[,payload1[,payload2...]]):<Boolean>`
`emit(eventObject):<Boolean>`
- **eventName** `<String>`: the event name for which to register this listener
- **eventObject** `<event>`: an event object that holds all necessary data
- returns false if there were no handlers, true otherwise

`eventNames():<Array>`
- returns an array of all the event names that have handlers

`getMaxListeners():0`
- a stub; this emitter does not support maximum numbers of listeners

`listenerCount(eventName):<Number>`
- **eventName** `<String>`: the event name
- returns the number of listeners registered for `eventName`

`listeners(eventName):<Array>`
- **eventName** `<String>`: the event name
- returns an array of listener functions (both normal and one-off) registered for `eventName`

`off(eventName[,listener])`
`removeListener(eventName[,listener])`
- **eventName** `<String>`: the event name from which to deregister this listener
- **listener** `<Function>`: a function that will be called; if not given, all listeners for `eventName` are removed
- returns the emitter object itself, allowing for chaining

`once(eventName,listener)`
- **eventName** `<String>`: the event name for which to register this listener
- **listener** `<Function>`: a function that will be called only once
- returns the emitter object itself, allowing for chaining

`prependListener(eventName,listener)`
- **eventName** `<String>`: the event name for which to register this listener
- **listener** `<Function>`: a function that will be called
- like `addListener()`, only it pushes `listener` to the front of the listeners
- returns the emitter object itself, allowing for chaining

`prependOnceListener(eventName,listener)`
- **eventName** `<String>`: the event name for which to register this listener
- **listener** `<Function>`: a function that will be called only once
- like `addListener()`, only it pushes `listener` to the front of the one-time listeners
- returns the emitter object itself, allowing for chaining

`removeAllListeners([eventName])`
- **eventName** `<String>`: if given, only `eventName` listeners will be expunged
- returns the emitter object itself, allowing for chaining

`setMaxListeners(number)`
- a stub; this emitter does not support maximum numbers of listeners

##### Events

`newListener(eventName,listener)`
- **eventName** `<String>`: the event name for which this listener is about to be registered
- **listener** `<Function>`: a function that will be called

`removeListener(eventName,listener)`
- **eventName** `<String>`: the event name for which this listener is about to be unregistered
- **listener** `<Function>`: a function that will be called

#### As a hierarchy-aware (parent/child relations) advanced event emitter

`addChild(childEmitter)`
- **childEmitter** `<emitter>`: the emitter instance to add as a child
- returns the emitter object itself, allowing for chaining

`callOnChildren(method[,params[,thisarg[,childArray]]])`
- **method** `<String>`: the method name to call on children emitters
- **params** `<Array>`: an array of method call arguments, presented as an Array, defaults to []
- **thisarg** `<Function|Object>`: the *this* argument for the method call, defaults to `this`
- **childArray** `<Array>`: if only a selected list of children should be triggered, this can be a filtered list
- returns the result value from the chain of method calls

Important: no matter how many `params` are given, there will always be an extra argument, 
and that is the result of the previous child's method call. In the first called child, it will be `null`.

`callOnParent(method[,params[,thisarg]])`
- **method** `<String>`: the method name to call on children emitters
- **params** `<Array>`: an array of method call arguments, presented as an Array, defaults to []
- **thisarg** `<Function|Object>`: the *this* argument for the method call, defaults to `this`
- returns either the result of the method call or `false` if there is no parent defined

`callOnSiblings(method[,params[,thisarg]])`
- **method** `<String>`: the method name to call on children emitters
- **params** `<Array>`: an array of method call arguments, presented as an Array, defaults to []
- **thisarg** `<Function|Object>`: the *this* argument for the method call, defaults to `this`
- returns the result value from the chain of method calls

`emitEvent(eventObject[,skipDirection])`
- **eventObject** `<event>`: an event object to emit
- **skipDirection** `<Number>`: one of the `PROPAGATES_*` constants from the event class, or 0 for no boundaries.
- returns the emitter object itself, allowing for chaining

Please be advised that using `emitEvent()` turns off the compatibility mode for `event.stopImmediatePropagation()`, and also `event.phase` is
set according to the current propagation phase.

`filterChildren(filterFunction):<Array>`
- **filterFunction** `<Function>`: a callback that is executed to filter the children emitters of the current one; internally, `Array.prototype.filter()` is used
- returns a filtered child array that can be fed as the last argument for `callOnChildren()` to selectively call methods on current children

`getAllChildren([dontDescend])`
- **dontDescend** an optional `<Array>` of `<emitter>` objects that the function should not descend to
- returns an `<Array>` of `<emitter>` objects which are registered as children of the current emitter or its children (recursively down to the last level)

`getChildren()`
- returns an `<Array>` of `<emitter>` objects which are registered as children of the current emitter

`getParent()`
- returns either `null` or a `<emitter>` which is a parent to the current emitter

`getRelations([dontDescend])`
- **dontDescend** an optional `<Array>` of `<emitter>` objects that the function should not descend to (only used in recursive calls)
- returns an `<Array>` of `<emitter>` objects which are related to the current `emitter` (are in the same propagation tree), regardless of how removed they are

`getSiblings()`
- returns an `<Array>` of `<emitter>`s that share the same parent as this emitter

`hasChild(childEmitter):<Boolean>`
- **childEmitter** `<emitter>`: an emitter or derivative
- returns true if **childEmitter* is a direct descendant of the current emitter; false otherwise

`hasParent():<Boolean>`
- returns true if this emitter has a parent

`removeAllChildren()`
- returns the emitter object itself, allowing for chaining

Removes all children of the current emitter instance.

`removeChild(childObject|index)`
- returns the emitter object itself, allowing for chaining

Removes a specified `childObject`, or the `emitter` that resides within the children at position held in `index`.

`removeSelf()`
- returns the emitter object itself, allowing for chaining

Removes the current emitter instance as a child from its parent. This is here instead of a `removeParent()` or similar.

`setOrder(first,second,third,fourth)`
- **first** <Number>: the first route to take; one of the `PROPAGATES_*` constants from the event class, or 0 for "do nothing"
- **second** <Number>: the second route to take; --""--
- **third** <Number>: the third route to take; --""--
- **fourth** <Number>: the fourth route to take; --""--
- returns the emitter object itself, allowing for chaining

If the event comes with a `getPropagation()` that contains `PROPAGATES_SATURATING`, then the order is discarded.

`shutdown()`
- returns the emitter object itself, allowing for chaining

Safely shut down this emitter, by letting go of foreign references; this allows for easier cleanup.

### `event`

This class can be used on its own as a basis for a generic event object, or it can be extended to suit your needs.

#### Constants

`PROPAGATES_NONE` = `0` meaning no propagation
`PROPAGATES_LOCAL` = `1` meaning only current emitter object
`PROPAGATES_UP` = `2` meaning only current emitter's parent
`PROPAGATES_DOWN` = `4` meaning only current emitter's children
`PROPAGATES_SIBLINGS` = `8` meaning only current emitter's siblings
`PROPAGATES_SATURATING` = `16` meaning the entire emitter tree

These constants can be `OR`ed, so for example a `PROPAGATES_UP`|`PROPAGATES_LOCAL` defines an event or an emitter that spreads events locally and up.
`PROPAGATES_SATURATING` is a special case which ignores the rest of the constants.

#### Methods
`new event(eventName[,payload[,origin]])`
- eventName `<String>`: the event's name (or type, YMMV)
- payload `<any>`: the event's payload, optional, defaults to `null`
- origin `<Function|Object>`: the function or object that created the event, optional, defaults to `null`

Creates a new event object (constructor).

`canPropagate([where])`
- **where** `<Number>`:
  - if nothing is given (no arguments), returns true if this event is allowed to propagate at all (not canceled);
  - if one of the `event` constants are given, then returns true if the event can propagate in that direction.
- returns `<Boolean>` 

`cancelEvent()`
`stopPropagation()`
- returns the event object itself, allowing for chaining

In *compatibility mode* (mainline 1.0.x), which is the default, these cancel the event, so they're equal to `stopImmediatePropagation()`.
In *native mode* (if the event is emitted with `emitter.emitEvent()`), these only cancel upward or downward propagation, leaving the local level intact.

In both modes, stops event propagation even on the same level -- ie. no more listeners are called.

`getPayload()`
`setPayload(newValue)`
`getResult()`
`setResult(newValue)`
- **newvValue** `<any>`
- **set\*** methods return the event object itself, allowing for chaining

Accessor methods for the event's built-in payload and result containers.

`getPropagation()`
`setPropagation(newValue)`
- **newValue** `<Number>`: an ORed list of `PROPAGATES_*` constants which tells the emitter which directions are allowed for propagation in this event
- **setPropagation()** returns the event object itself

Setting this and `emitter.setOrder()` will jointly decide how an event can propagate. In extreme situations, like where the emitter is set up to emit
only locally and upwards, and the event set up so that it would only propagates downwards, no event is actually emitted even though there are no
stop*Propagation() calls and the `emitter.emitEvent()` is called.

`stopImmediatePropagation()`
- returns the event object itself, allowing for chaining

#### Static properties

`event.defaultPropagation`: `<Number>`

The value (an ORed list of `PROPAGATES_*` constants) which newly created event objects use as their setPropagation() defaults.

#### Properties

`bubbles`: `<Boolean>`

If true, the event can traverse outside its local boundary.

`currentTarget`: `<emitter>`

The current emitter that is emitting this event object.

`eventPhase`: `<Number>`

One of the `PROPAGATES_*` constants, depending on current traversal status. In "saturating" propagation, 
it's set to `PROPAGATES_LOCAL` only at the start, then for the rest of propagation it's `PROPAGATES_SATURATING`.

`timeStamp`: `<Number>`

The millisecond-precise epochal time when the event object came to be.

`target`: `<Function|Object>`

The event's origin function or object, as set by the third argument of the constructor, defaults to `null`.

`type`: `<String>`

Contains the event name/type.
