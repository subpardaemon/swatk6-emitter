/**
 * swatk6/emitter
 * @version v1.1.0
 * @author Andras Kemeny
 * 
 * A drop-in replacement for EventEmitter that can handle DOM-style events whose propagation can be stopped.
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
    /** @type {String} */
    this.type = eventType;
    /** @type {*} */
    this.target = target;
    this._propagates = swatk6_event.defaultPropagation;
    this.bubbles = (this._propagation&swatk6_event.PROPAGATES_DOWN || this._propagation&swatk6_event.PROPAGATES_UP);
    /** @type {*} */
    this.payload = payload;
    /** @type {*} */
    this.result = null;
    /** @type {swatk6_emitter} */
    this.currentTarget = null;
    /** @type {Number} */
    this.eventPhase = swatk6_event.PROPAGATES_NONE;
    /** @type {Number} */
    this.timeStamp = new Date().getTime();
    this._bkwcmpt = true;
}
swatk6_event.PROPAGATES_NONE = 0;
swatk6_event.PROPAGATES_LOCAL = 1;
swatk6_event.PROPAGATES_UP = 2;
swatk6_event.PROPAGATES_DOWN = 4;
swatk6_event.PROPAGATES_SIBLINGS = 8;
swatk6_event.PROPAGATES_SATURATING = 16;
swatk6_event.defaultPropagation = swatk6_event.PROPAGATES_LOCAL|swatk6_event.PROPAGATES_DOWN|swatk6_event.PROPAGATES_UP;
/**
 * Get the current result value.
 * @returns {swatk6_event._result}
 */
swatk6_event.prototype.getResult = function() {
    return this.result;
};
/**
 * Set the current result value.
 * @param {*} v result value
 * @returns {swatk6_event}
 */
swatk6_event.prototype.setResult = function(v) {
    this.result = v;
    return this;
};
/**
 * Get the current payload.
 * @returns {swatk6_event.payload}
 */
swatk6_event.prototype.getPayload = function() {
    return this.payload;
};
/**
 * Sets the current payload.
 * @param {type} v the new payload
 * @returns {swatk6_event}
 */
swatk6_event.prototype.setPayload = function(v) {
    this.payload = v;
    return this;
};
/**
 * Gets the current propagation setting; cf. PROPAGATES_* constants.
 * @returns {Number}
 * @since v1.1.0
 */
swatk6_event.prototype.getPropagation = function() {
    return this.propagates;
};
/**
 * Set the new propagation model.
 * 
 * Valid values (can be ORed):
 * - swatk6_event.PROPAGATES_LOCAL (1): propagates on the level (emitter) it started at
 * - swatk6_event.PROPAGATES_UP (2): propagates to the current emitter's parents, if any
 * - swatk6_event.PROPAGATES_DOWN (4): propagates to the current emitter's children, if any
 * - swatk6_event.PROPAGATES_SIBLINGS (8): propagates to the current emitter's siblings, if any
 * - swatk6_event.PROPAGATES_SATURATING (16): propagates to the whole emitter tree, and ignores any other PROPAGATES_* setting
 * - or a big fat 0, but what's the point of that? Actually, that acts as a stopImmediatePropagation() before even the first listener would be called.
 * 
 * If the new value is either LOCAL or none, it sets this.bubbles to false, otherwise to true.
 * 
 * @param {Number} v the new setting (cf. PROPAGATES_* constants)
 * @returns {swatk6_event}
 * @since v1.1.0
 */
swatk6_event.prototype.setPropagation = function(v) {
    this._propagates = v;
    if (this._propagates<=1) {
	this.bubbles = false;
    } else {
	this.bubbles = true;
    }
    return this;
};
/**
 * Stop the propagation of this event (stop calling the other event listeners).
 * @returns {swatk6_event}
 */
swatk6_event.prototype.stopPropagation = function() {
    if (this._bkwcmpt===true) {
	this._propagates = 0;
    } else {
	this._propagates = this._propagates & 1;
    }
    this.bubbles = false;
    return this;
};
/**
 * Stop the propagation of this event even on the current level, and on any further level.
 * @returns {swatk6_event}
 */
swatk6_event.prototype.stopImmediatePropagation = function() {
    this._propagates = 0;
    this.bubbles = false;
    return this;
};
/**
 * Alias to stopImmediatePropagation().
 * @returns {swatk6_event}
 */
swatk6_event.prototype.cancelEvent = function() {
    return this.stopImmediatePropagation();
};
/**
 * Returns true if the event can propagate (event listneres can be called) in general or in a specific direction.
 * @param {Number} [where=undefined] if undefined, returns true if the event can propagate at all; if any of the PROPAGATES_* constants, then return true if the event can propagate in that direction
 * @returns {Boolean}
 */
swatk6_event.prototype.canPropagate = function(where) {
    if (typeof where==='undefined') {
	return this._propagates>0;
    }
    else if (where===swatk6_event.PROPAGATES_LOCAL) {
    	return ((this._propagates&swatk6_event.PROPAGATES_LOCAL)>0);
    }
    else if (where===swatk6_event.PROPAGATES_UP) {
	return ((this._propagates&swatk6_event.PROPAGATES_UP)>0 && this.bubbles);
    }
    else if (where===swatk6_event.PROPAGATES_DOWN) {
	return ((this._propagates&swatk6_event.PROPAGATES_DOWN)>0 && this.bubbles);
    }
    else if (where===swatk6_event.PROPAGATES_SIBLINGS) {
	return ((this._propagates&swatk6_event.PROPAGATES_SIBLINGS)>0 && this.bubbles);
    }
    else if (where===swatk6_event.PROPAGATES_SATURATING) {
	return ((this._propagates&swatk6_event.PROPAGATES_SATURATING)>0 && this.bubbles);
    }
    return this._propagates>0;
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
    this._setup();
}
swatk6_emitter.defaultMaxListeners = 0;
swatk6_emitter.defaultFirstDirection = swatk6_event.PROPAGATES_LOCAL;
swatk6_emitter.defaultSecondDirection = swatk6_event.PROPAGATES_DOWN;
swatk6_emitter.defaultThirdDirection = swatk6_event.PROPAGATES_UP;
swatk6_emitter.defaultFourthDirection = swatk6_event.PROPAGATES_NONE;
/**
 * This is called before any on and off handlers so that there is no need for a constructor.
 * @inner
 */
swatk6_emitter.prototype._setup = function() {
    if (typeof this._listeners==='undefined') {
	this._listeners = {};
	this._listenersOnce = {};
	/** @type {swatk6_emitter} */
	this._parent = null;
	/** @type {swatk6_emitter[]} */
	this._children = [];
	this.setOrder(swatk6_emitter.defaultFirstDirection,swatk6_emitter.defaultSecondDirection,swatk6_emitter.defaultThirdDirection,swatk6_emitter.defaultFourthDirection);
    }
};
/**
 * Set the order of event propagation.
 * 
 * Default is PROPAGATES_LOCAL -> PROPAGATES_DOWN -> PROPAGATES_UP.
 * 
 * @param {Number} first - one of the swatk6_event.PROPAGATES_* constants
 * @param {Number} second - one of the swatk6_event.PROPAGATES_* constants
 * @param {Number} third - one of the swatk6_event.PROPAGATES_* constants
 * @param {Number} fourth - one of the swatk6_event.PROPAGATES_* constants
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.setOrder = function(first,second,third,fourth) {
    var d = [first];
    d.push((second!==first) ? second : 0);
    d.push((third!==second && third!==first) ? third : 0);
    d.push((fourth!==third && fourth!==second && fourth!==first) ? fourth : 0);
    this._direction = d;
    return this;
};
/**
 * Shut down the emitter and release all references.
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.shutdown = function() {
    this._listeners = {};
    this._listenersOnce = {};
    /* let's not keep circular links around */
    this.removeSelf();
    this.removeAllChildren();
    return this;
};
/*
 * ----------------------------------------------------------------------------
 * PARENT/CHILD HIERARCHY STUFF
 * ----------------------------------------------------------------------------
 */
/**
 * Get the parent of the emitter.
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.getParent = function() {
    return this._parent;
};
/**
 * Returns true if this emitter has a parent.
 * @returns {Boolean}
 */
swatk6_emitter.prototype.hasParent = function() {
    return this._parent!==null;
};
/**
 * Oy vey
 * @private
 * @param {Array} list
 * @returns {undefined}
 */
swatk6_emitter.prototype.abcug = function(list) {
    console.log('!!!!!',this.origi);
    for(var i=0;i<list.length;i++) {
	console.log(list[i].origi);
    }
};
/**
 * Get a complete relational tree, starting from this object.
 * 
 * Rule of mapping:
 * 1. First this emitter, and its siblings.
 * 2. Then all the children of the ones in 1. except for those specified in dontDescend, to avoid unnecessary recursion.
 * 3. Then finally if this emitter has a parent, this whole mapping is called on that, obviously specifying the current emitter and its siblings as dontDescend, since they are already mapped.
 * 
 * @param {swatk6_emitter[]} [dontDescend=[]]
 * @returns {swatk6_emitter[]}
 */
swatk6_emitter.prototype.getRelations = function(dontDescend) {
    if (typeof dontDescend==='undefined') {
	dontDescend = [];
    }
    var relations = this.getSiblings();
    relations.unshift(this);
    var nodescend = relations.slice();
    var children = [];
    for(var i=0;i<relations.length;i++) {
	children = children.concat(relations[i].getAllChildren(dontDescend));
    }
    relations = relations.concat(children);
    if (this.hasParent()) {
	relations = relations.concat(this._parent.getRelations(nodescend));
    }
    //if (dontDescend.length===0) this.abcug(relations);
    return relations;
};
/**
 * Get a copy of the array that holds the children of this emitter.
 * @returns {swatk6_emitter[]}
 */
swatk6_emitter.prototype.getChildren = function() {
    return this._children.slice();
};
/**
 * Return all the children and their children (recursively) of this emitter.
 * @param {swatk6_emitter[]} [dontDescend=[]]
 * @returns {swatk6_emitter[]}
 */
swatk6_emitter.prototype.getAllChildren = function(dontDescend) {
    if (typeof dontDescend==='undefined') {
	dontDescend = [];
    }
    var result = this._children.slice().filter(function(v) {
	return dontDescend.indexOf(v)===-1;
    });
    if (result.length>0) {
	for(var i=0;i<result.length;i++) {
	    //if (dontDescend.indexOf(result[i])===-1) {
	    result = result.concat(result[i].getAllChildren(dontDescend));
	    //}
	}
    }
    return result;
};
/**
 * 
 * @param {swatk6_emitter} childObj
 * @returns {Boolean}
 */
swatk6_emitter.prototype.hasChild = function(childObj) {
    return (this._children.indexOf(childObj)>-1);
};
/**
 * Add a child to the emitter.
 * @param {swatk6_emitter} childObj
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.addChild = function(childObj) {
    if (this._children.indexOf(childObj)===-1) {
	var cpar = childObj.getParent();
	if (cpar!==null) {
	    cpar.removeChild(childObj);
	}
	this._children.push(childObj);
	childObj._parent = this;
	this.emit('childAdded',childObj);
    }
    return this;
};
/**
 * Remove a particular child of this emitter.
 * @param {swatk6_emitter} childObj
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.removeChild = function(childObj) {
    var x;
    if (typeof childObj==='number' && x<this._children.length) {
	x = childObj;
    } else {
	x = this._children.indexOf(childObj);
    }
    if (x>-1) {
	childObj = this._children[x];
	childObj.emit('beforeChildRemoved',childObj);
	this.emit('beforeChildRemoved',childObj);
	this._children.splice(x,1);
	childObj._parent = null;
	this.emit('childRemoved',childObj);
    }
    return this;
};
/**
 * Get the siblings of this emitter.
 * @returns {swatk6_emitter[]}
 */
swatk6_emitter.prototype.getSiblings = function() {
    if (!this.hasParent()) {
	return [];
    }
    var sibl = this.callOnParent('getChildren');
    sibl = sibl.filter(function(sibling) {
	return sibling!==this;
    }.bind(this));
    //this.abcug(sibl);
    return sibl;
};
/**
 * If this has a parent, removes iself from that parent's children list.
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.removeSelf = function() {
    if (this._parent!==null) {
	this._parent.removeChild(this);
    }
    return this;
};
/**
 * Remove all children of this emitter.
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.removeAllChildren = function() {
    for(var i=0;i<this._children.length;i++) {
	this.removeChild(this._children[i]);
    }
    return this;
};
/**
 * Call a method on our parent, if there is one.
 * @param {String} method the method to call
 * @param {Array} [params=[]] the params for the method call
 * @param {*} [thisarg=parent] the this argument for method.apply
 * @returns {*|Boolean}
 */
swatk6_emitter.prototype.callOnParent = function(method,params,thisarg) {
    if (typeof thisarg==='undefined') {
	thisarg = this._parent;
    }
    if (typeof params==='undefined') {
	params = [];
    }
    if (this._parent!==null && typeof this._parent[method]==='function') {
	return this._parent[method].apply(thisarg,params);
    }
    return false;
};
/**
 * Call a method on each of our children.
 * @param {String} method the method to call
 * @param {Array} [params=[]] the params for the method call
 * @param {*} thisarg the this argument for method.apply
 * @param {Array} [childarray=this._children] the children on which to call this method
 * @returns {*}
 */
swatk6_emitter.prototype.callOnChildren = function(method,params,thisarg,childarray) {
    if (typeof childarray==='undefined') {
	childarray = this._children;
    }
    if (typeof thisarg==='undefined') {
	thisarg = null;
    }
    if (typeof params==='undefined') {
	params = [];
    }
    params.push(null);
    var cthisarg = thisarg;
    
    for(var i=0;i<childarray.length;i++) {
	if (typeof childarray[i][method]==='function') {
	    if (thisarg===null) {
		cthisarg = childarray[i];
	    }
	    params[params.length-1] = childarray[i][method].apply(cthisarg,params);
	}
    }
    return params.pop();
};
/**
 * Call a method on each of our siblings.
 * @param {String} method the method to call
 * @param {Array} [params=[]] the params for the method call
 * @param {*} thisarg the this argument for method.apply
 * @returns {*}
 */
swatk6_emitter.prototype.callOnSiblings = function(method,params,thisarg) {
    if (typeof thisarg==='undefined') {
	thisarg = null;
    }
    if (typeof params==='undefined') {
	params = [];
    }
    return this.callOnChildren(method,params,thisarg,this.getSiblings());
};
/**
 * Create a copy of the children array, and include only members who pass the test in filterfunc.
 * @param {Function} filterfunc
 * @returns {Array}
 */
swatk6_emitter.prototype.filterChildren = function(filterfunc) {
    return this._children.filter(filterfunc);
};
/*
 * ----------------------------------------------------------------------------
 * EVENT EMITTER BASE FUNCTIONS
 * ----------------------------------------------------------------------------
 */
/**
 * Add an event listener.
 * @param {string} eventName
 * @param {Function} callbackFunc
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.on = function(eventName,callbackFunc) {
    return this.addListener(eventName,callbackFunc,false,false);
};
/**
 * Prepend an event listener.
 * @param {String} eventName
 * @param {Function} callbackFunc
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.prependListener = function(eventName,callbackFunc) {
    return this.addListener(eventName,callbackFunc,false,true);
};
/**
 * Add an event listener that activates only once.
 * @param {string} eventName
 * @param {Function} callbackFunc
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.once = function(eventName,callbackFunc) {
    return this.addListener(eventName,callbackFunc,true,false);
};
/**
 * Prepend an event listener that activates only once.
 * @param {String} eventName
 * @param {Function} callbackFunc
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.prependOnceListener = function(eventName,callbackFunc) {
    return this.addListener(eventName,callbackFunc,true,true);
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
    var o = (once===true) ? this._listenersOnce : this._listeners;
    if (typeof o[eventName]==='undefined') {
	o[eventName] = [];
    }
    var w = (prepend===true) ? 'unshift' : 'push';
    this.emit('newListener',eventName,callbackFunc);
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
	this._listeners[eventName] = [];
	this._listenersOnce[eventName] = [];
    }
    else {
	if (this._listeners[eventName].indexOf(callbackFunc)>=0) {
	    this._listeners[eventName].splice(this.listeners[eventName].indexOf(callbackFunc),1);
	}
	else if (this.listenersOnce[eventName].indexOf(callbackFunc)>=0) {
	    this._listenersOnce[eventName].splice(this.listenersOnce[eventName].indexOf(callbackFunc),1);
	}
    }
    this.emit('removeListener',eventName,callbackFunc);
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
    this._listeners = {};
    this._listenersOnce = {};
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
 * Returns an array listing the events for which the emitter has registered listeners. The values in the array will be strings or Symbols.
 * @returns {Array}
 */
swatk6_emitter.prototype.eventNames = function() {
    this._setup();
    var n = Object.keys(this._listeners);
    var x = Object.keys(this._listenersOnce);
    for(var i=0;i<x.length;i++) {
	if (n.indexOf(x[i])>-1) {
	    n.push(x[i]);
	}
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
    this._setup();
    var c = (typeof this._listeners[eventName]!=='undefined') ? this._listeners[eventName].length : 0;
    c += (typeof this._listenersOnce[eventName]!=='undefined') ? this._listenersOnce[eventName].length : 0;
    return c;
};
/**
 * Returns a copy of the array of listeners for the event named eventName.
 * @param {type} eventName
 * @returns {Array}
 */
swatk6_emitter.prototype.listeners = function(eventName) {
    this._setup();
    var a = [];
    if (typeof this._listeners[eventName]!=='undefined') {
	a = this._listeners[eventName].slice();
    }
    if (typeof this._listenersOnce[eventName]!=='undefined') {
	for(var i=0;i<this._listenersOnce[eventName].length;i++) {
	    a.push(this._listenersOnce[eventName][i]);
	}
    }
    return a;
};
/**
 * Emit an event; OLD FORMAT: only works on local level.
 * @param {(swatk6_event|String}} eventObject a valid event object (new functionality) or an event name/type
 * @returns {boolean}
 */
swatk6_emitter.prototype.emit = function(eventObject) {
    this._setup();
    var params = new Array(arguments.length);
    for(var i = 0; i < params.length; ++i) {
        params[i] = arguments[i];
    }
    var i = 0, evType = '', isEvObject = (typeof eventObject['canPropagate']==='function' && typeof eventObject['type']!=='undefined');
    if (isEvObject) {
	evType = eventObject['type'];
    } else {
	evType = eventObject;
	params.shift();
    }
    var calls = this._emitCommon(evType,(typeof params[0]!=='undefined') ? params[0] : null);
    if (calls.length===0) {
	return false;
    }
    if (isEvObject) {
	eventObject.eventPhase = swatk6_event.PROPAGATES_LOCAL;
	eventObject.currentTarget = this;
    }
    try {
	for(i=0;i<calls.length;i++) {
	    if (!isEvObject || eventObject.canPropagate(swatk6_event.PROPAGATES_LOCAL)) {
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
 * Emit an event object; NEW FORMAT: can follow parent/children with event emission.
 * @param {swatk6_event} eventObject THIS IS NOT OPTIONAL, THE NEW FORMAT ONLY WORKS WITH swatk6_event EVENTS!
 * @param {Number} [skipDirection=0] which directions to skip
 * @returns {swatk6_emitter}
 */
swatk6_emitter.prototype.emitEvent = function(eventObject,skipDirection) {
    this._setup();
    if (typeof skipDirection==='undefined') {
	skipDirection = 0;
    }
    eventObject._bkwcmpt = false;
    if (eventObject.canPropagate(swatk6_event.PROPAGATES_SATURATING)) {
	var emitters = this.getRelations();
	//this.abcug(emitters);
	for(var i=0;i<emitters.length;i++) {
	    if (emitters[i]===this) {
		eventObject.eventPhase = swatk6_event.PROPAGATES_LOCAL;
	    } else {
		eventObject.eventPhase = swatk6_event.PROPAGATES_SATURATING;
	    }
	    emitters[i]._emitCommon2(eventObject,eventObject.eventPhase);
	    if (!eventObject.canPropagate(swatk6_event.PROPAGATES_SATURATING)) {
		break;
	    }
	}
    } else {
	for(var i=0;i<4;i++) {
	    switch(this._direction[i]) {
		case swatk6_event.PROPAGATES_LOCAL:
		    //console.log(this.origi,'local propagation check');
		    if (eventObject.canPropagate(swatk6_event.PROPAGATES_LOCAL) && (swatk6_event.PROPAGATES_LOCAL&skipDirection)===0) {
			if (eventObject.eventPhase===swatk6_event.PROPAGATES_NONE) {
			    eventObject.eventPhase = swatk6_event.PROPAGATES_LOCAL;
			}
			//console.log(this.origi,'local emitting');
			this._emitCommon2(eventObject,eventObject.eventPhase);
		    }
		    break;
		case swatk6_event.PROPAGATES_DOWN:
		    //console.log(this.origi,'downward propagation check');
		    if (eventObject.canPropagate(swatk6_event.PROPAGATES_DOWN) && (swatk6_event.PROPAGATES_DOWN&skipDirection)===0) {
			eventObject.eventPhase = swatk6_event.PROPAGATES_DOWN;
			//console.log(this.origi,'propagating down');
			this.callOnChildren('emitEvent',[eventObject,swatk6_event.PROPAGATES_UP|swatk6_event.PROPAGATES_SIBLINGS]);
		    }
		    break;
		case swatk6_event.PROPAGATES_UP:
		    //console.log(this.origi,'upward propagation check');
		    if (eventObject.canPropagate(swatk6_event.PROPAGATES_UP) && (swatk6_event.PROPAGATES_UP&skipDirection)===0) {
			eventObject.eventPhase = swatk6_event.PROPAGATES_UP;
			//console.log(this.origi,'propagating up');
			this.callOnParent('emitEvent',[eventObject,swatk6_event.PROPAGATES_DOWN|swatk6_event.PROPAGATES_SIBLINGS]);
		    }
		    break;
		case swatk6_event.PROPAGATES_SIBLINGS:
		    //console.log(this.origi,'sideways propagation check');
		    if (eventObject.canPropagate(swatk6_event.PROPAGATES_SIBLINGS) && (swatk6_event.PROPAGATES_SIBLINGS&skipDirection)===0) {
			eventObject.eventPhase = swatk6_event.PROPAGATES_SIBLINGS;
			//console.log(this.origi,'propagating sideways');
			this.callOnSiblings('emitEvent',[eventObject,swatk6_event.PROPAGATES_SIBLINGS|swatk6_event.PROPAGATES_DOWN|swatk6_event.PROPAGATES_UP]);
		    }
		    break;
	    }
	}
    }
    return this;
};
/**
 * @private
 * @param {String} evType
 * @param {*} [errParam=null]
 * @returns {Array}
 */
swatk6_emitter.prototype._emitCommon = function(evType,errParam) {
    if (evType==='error' && this.listenerCount('error')===0) {
	var e = (errParam!==null) ? errParam : new Error("No 'error' handler for an error event");
	throw e;
    }
    var calls = this.listeners(evType);
    this._listenersOnce[evType] = {};
    return calls;
};
/**
 * @private
 * @param {swatk6_event} eventObject
 * @param {Number} propagateAs
 * @returns {undefined}
 */
swatk6_emitter.prototype._emitCommon2 = function(eventObject,propagateAs) {
    eventObject.currentTarget = this;
    var calls = this._emitCommon(eventObject.type,eventObject._payload);
    try {
	for(i=0;i<calls.length;i++) {
	    if (eventObject.canPropagate(propagateAs)) {
		calls[i].apply(this,[eventObject]);
	    }
	}
    }
    catch(e) {
	this.emit('error',e);
    }
};

module.exports.event = swatk6_event;
module.exports.emitter = swatk6_emitter;
