# swatk6-emitter

A drop-in replacement for EventEmitter that can handle DOM-style events whose propagation can be stopped.

This module exports two classes: `.emitter` and `.event`. The `.emitter` can be used as a basis for `extend`ing your own class, and the `.event` class can be used by itself or be extended to serve your needs for an in-transit cancelable event.

## `emitter`

This class provides a drop-in replacement functionality for Node's official `EventEmitter` class. It's API-compatible for the most part, but it has a few subtle differences.

- It does not care about maximum listener counts (it's just an excuse to tolerate bad programming).
- The class internals look decidedly different from the official `EventEmitter` implementation, so any hacks building on interals abuse will not work.
- This class does not optimize for single listeners (which are done without an `Array` in the official implementation), so it might lose a few cycles when compared to the original.*
- Neither does it optimize for single or multiple arguments; the algorithm I used for extracting arguments is one that avoids that famed V8 slowdown bug.*
- It supports an object-based (`.event`) event approach that allows for payload and result distribution among listeners (allowing the use of events for dynamically configurable filters and data modifiers) and cancelable events (that stop any subsequent listeners to be called).

*: If you experience significant slowdowns because of these optimization omissions, let me know in an issue and I'll reintroduce them to the codeline.

The only noticable signature difference is in `.emitter.emit()`, as it, beside the original signature, also supports the new signature for the `.event` objects:

`.emitter.emit(<EventObject>)` : in this case, <EventObject> would be an `.event` object or one that extends it.

## `event`

This class can be used on its own as a basis for a generic event object, or it can be extended to suit your needs.

### Methods
`new event(eventName[,payload[,origin]])`
- eventName `<String>`: the event's name (or type, YMMV)
- payload `<any>`: the event's payload, optional, defaults to `null`
- origin `<Function|Object>`: the function or object that created the event, optional, defaults to `null`

Creates a new event object (constructor).

`event.canPropagate()`
- returns `<Boolean>` 

Returns `true` if the event is not canceled and can move on to the next listner, if there is one; `false` otherwise.

`event.stopPropagation()`
`event.stopImmediatePropagation()`
`event.cancelEvent()`
- returns the event object itself, allowing for chaining

These cancel the current event, so it won't get to any subsequent listeners. They all do the same, the aliases are there for convenience.

`event.getPayload()`
`event.setPayload(newValue)`
`event.getResult()`
`event.setResult(newValue)`
- **newvValue** `<any>`
- **set\*** methods return the event object itself, allowing for chaining

Accessor methods for the event's built-in payload and result containers.

### Properties

`event.type`: `<String>`

Contains the event name/type.

`event.target`: `<Function|Object>`

The event's origin function or object, as set by the third argument of the constructor, defaults to `null`.
