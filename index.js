/**
 * TODO
 * 
 * LICENSE: MIT
 * (c) Andras Kemeny, subpardaemon@gmail.com
 */

/*
 * ----------------------------------------------------------------------------
 * EVENT BASECLASS
 * ----------------------------------------------------------------------------
 */

/**
 * Base event class, where events can have a type, a result, a payload and a way to stop propagation of the event to the next listeners.
 * @constructor
 * @param {string} eventType
 * @param {*} [payload=null]
 * @param {Function} [target=null] the original emitter
 * @returns {swatk6_event}
 */
function swatk6_event(eventType,payload,target) {
    if (typeof payload==='undefined') {
	payload = null;
    }
    if (typeof target==='undefined') {
	target = null;
    }
    this.type = eventType;
    this.target = target;
    this._propagates = true;
    this._payload = payload;
    this._result = null;
}
/**
 * Get the current result value.
 * @returns {swatk6_event._result}
 */
swatk6_event.prototype.getResult = function() {
    return this._result;
};
/**
 * Set the current result value.
 * @param {*} v result value
 * @returns {swatk6_event}
 */
swatk6_event.prototype.setResult = function(v) {
    this._result = v;
    return this;
};
/**
 * Get the current payload.
 * @returns {swatk6_event.payload}
 */
swatk6_event.prototype.getPayload = function() {
    return this._payload;
};
/**
 * Sets the current payload.
 * @param {type} v the new payload
 * @returns {swatk6_event}
 */
swatk6_event.prototype.setPayload = function(v) {
    this._payload = v;
    return this;
};
/**
 * Stop the propagation of this event (stop calling the other event listeners).
 * @returns {swatk6_event}
 */
swatk6_event.prototype.stopPropagation = function() {
    this._propagates = false;
    return this;
};
/**
 * Alias to stopPropagation().
 * @returns {swatk6_event}
 */
swatk6_event.prototype.stopImmediatePropagation = function() {
    return this.stopPropagation();
};
/**
 * True if the event can propagate (event listneres can be called).
 * @returns {Boolean}
 */
swatk6_event.prototype.canPropagate = function() {
    return this._propagates;
};

/*
 * ----------------------------------------------------------------------------
 * EMITTER BASECLASS
 * ----------------------------------------------------------------------------
 */

/**
 * The base emitter class, please extend this.
 * @returns {swatk6_emitter}
 */
function swatk6_emitter() {
    this.listeners = {};
    this.listenersOnce = {};
}
swatk6_emitter.defaultMaxListeners = 0;
/**
 * This is called before any on and off handlers so that there is no need for a constructor.
 * @inner
 */
swatk6_emitter.prototype._setup = function() {
    if (typeof this.listeners==='undefined') {
	this.listeners = {};
	this.listenersOnce = {};
    }
};
/**
 * Add an event listener.
 * @param {string} eventName
 * @param {Function} callbackFunc
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.on = function(eventName,callbackFunc) {
    return this.addEventListener(eventName,callbackFunc,false,false);
};
/**
 * Prepend an event listener.
 * @param {String} eventName
 * @param {Function} callbackFunc
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.prependListener = function(eventName,callbackFunc) {
    return this.addEventListener(eventName,callbackFunc,false,true);
};
/**
 * Add an event listener that activates only once.
 * @param {string} eventName
 * @param {Function} callbackFunc
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.once = function(eventName,callbackFunc) {
    return this.addEventListener(eventName,callbackFunc,true,false);
};
/**
 * Prepend an event listener that activates only once.
 * @param {String} eventName
 * @param {Function} callbackFunc
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.prependOnceListener = function(eventName,callbackFunc) {
    return this.addEventListener(eventName,callbackFunc,true,true);
};
/**
 * Add a normal or a one-time-only event listener.
 * @param {string} eventName
 * @param {Function} callbackFunc
 * @param {boolean} [once=false]
 * @param {boolean} [prepend=false]
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.addListener = function(eventName,callbackFunc,once,prepend) {
    this._setup();
    if (typeof once==='undefined') {
	once = false;
    }
    if (typeof prepend==='undefined') {
	prepend = false;
    }
    var o = (once===true) ? this.listenersOnce : this.listeners;
    if (typeof o[eventName]==='undefined') {
	o[eventName] = [];
    }
    var w = (prepend===true) ? 'unshift' : 'push';
    o[eventName][w](callbackFunc);
    return this;
};
/**
 * Remove an event listener.
 * @param {string} eventName
 * @param {Function} [callbackFunc=null] if this is null, all event listeners for eventName will be removed.
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.off = function(eventName,callbackFunc) {
    this._setup();
    if (typeof callbackFunc==='undefined' || typeof callbackFunc!=='function') {
	callbackFunc = null;
    }
    if (callbackFunc===null) {
	this.listeners[eventName] = [];
	this.listenersOnce[eventName] = [];
    }
    else {
	if (this.listeners[eventName].indexOf(callbackFunc)>=0) {
	    this.listeners[eventName].splice(this.listeners[eventName].indexOf(callbackFunc),1);
	}
	else if (this.listenersOnce[eventName].indexOf(callbackFunc)>=0) {
	    this.listenersOnce[eventName].splice(this.listenersOnce[eventName].indexOf(callbackFunc),1);
	}
    }
    return this;
};
/**
 * Removes all listeners, or those of the specified eventName.
 * @param {String} [eventName=undefined]
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.removeAllListeners = function(eventName) {
    if (typeof eventName!=='undefined') {
	return this.off(eventName);
    }
    this.listeners = {};
    this.listenersOnce = {};
    return this;
};
/**
 * Remove an event listener.
 * @param {string} eventName
 * @param {Function} [callbackFunc=null] if this is null, all event listeners for eventName will be removed.
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.removeListener = function(eventName,callbackFunc) {
    if (typeof callbackFunc==='undefined' || typeof callbackFunc!=='function') {
	callbackFunc = null;
    }
    return this.off(eventName,callbackFunc);
};
/**
 * Emit an event.
 * @param {(swatk6_event|String}} eventObject a valid event object (new functionality) or an event name/type
 * @returns {boolean}
 */
swatk6_emitter.prototype.emit = function(eventObject) {
    this._setup();
    var params = new Array(arguments.length);
    for(var i = 0; i < params.length; ++i) {
        params[i] = arguments[i];
    }
    var i = 0, evType = '';
    if (typeof eventObject['canPropagate']==='function' && typeof eventObject['type']!=='undefined') {
	evType = eventObject['type'];
    } else {
	evType = eventObject;
	params.shift();
    }
    if (evType==='error' && this.listenerCount('error')===0) {
	var e = (typeof params[0]!=='undefined') ? params[0] : new Error("No 'error' handler for an error event");
	throw e;
    }
    var calls = this.listeners(evType);
    this.listenersOnce[evType] = {};
    if (calls.length===0) {
	return false;
    }
    try {
	for(i=0;i<calls.length;i++) {
	    if (typeof eventObject['canPropagate']!=='function' || eventObject.canPropagate()) {
		    calls[i].apply(this,params);
	    }
	}
    }
    catch(e) {
	this.emit('error',e);
    }
    return true;
};
/**
 * Returns an array listing the events for which the emitter has registered listeners. The values in the array will be strings or Symbols.
 * @returns {Array}
 */
swatk6_emitter.prototype.eventNames = function() {
    var n = Object.keys(this.listeners);
    var x = Object.keys(this.listenersOnce);
    for(var i=0;i<x.length;i++) {
	n.push(x[i]);
    }
    return n;
};
/**
 * Returns 0 (stub).
 * @returns {number}
 */
swatk6_emitter.prototype.getMaxListeners = function() {
    return 0;
};
/**
 * Stub.
 * @param {Number} n
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.setMaxListeners = function(n) {
    return this;
};
/**
 * Returns the number of listeners listening to the event named eventName.
 * @param {String} eventName
 * @returns {Number}
 */
swatk6_emitter.prototype.listenerCount = function(eventName) {
    var c = (typeof this.listeners[eventName]!=='undefined') ? this.listeners[eventName].length : 0;
    c += (typeof this.listenersOnce[eventName]!=='undefined') ? this.listenersOnce[eventName].length : 0;
    return c;
};
/**
 * Returns a copy of the array of listeners for the event named eventName.
 * @param {type} eventName
 * @returns {Array}
 */
swatk6_emitter.prototype.listeners = function(eventName) {
    var a = [], i;
    if (typeof this.listeners[eventName]!=='undefined') {
	for(i=0;i<this.listeners[eventName].length;i++) {
	    a.push(this.listeners[eventName][i]);
	}
    }
    if (typeof this.listenersOnce[eventName]!=='undefined') {
	for(i=0;i<this.listenersOnce[eventName].length;i++) {
	    a.push(this.listenersOnce[eventName][i]);
	}
    }
    return a;
};

module.exports.event = swatk6_event;
module.exports.emitter = swatk6_emitter;
