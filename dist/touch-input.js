(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.touchInput = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _libInputJs = require('./lib/input.js');

var _libInputJs2 = _interopRequireDefault(_libInputJs);

exports['default'] = _libInputJs2['default'];
module.exports = exports['default'];
},{"./lib/input.js":3}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _eventemitter3 = require('eventemitter3');

var _eventemitter32 = _interopRequireDefault(_eventemitter3);

require('./polyfill.js');

var _touchJs = require('./touch.js');

var _touchJs2 = _interopRequireDefault(_touchJs);

var HAS_TOUCH = ('ontouchstart' in window);
var EVENT_MAP = HAS_TOUCH ? {
  touchstart: 'start',
  touchmove: 'move',
  touchend: 'end',
  touchcancel: 'end'
} : {
  mousedown: 'start',
  mousemove: 'move',
  mouseup: 'end'
};
var EVENTS = Object.keys(EVENT_MAP);

var Input = (function (_EventEmitter) {
  _inherits(Input, _EventEmitter);

  function Input() {
    _classCallCheck(this, Input);

    _EventEmitter.call(this);
    this.touches = new Set();
    this.actives = new Map();
    this.tickBound = this.tick.bind(this);
    this.tickInterval = 0;
    this.pooledTouches = [];
  }

  Input.prototype.attach = function attach() {
    var _this = this;

    if (this.attached) {
      return;
    }
    this.attached = true;
    this.tickInterval = window.requestAnimationFrame(this.tickBound);
    EVENTS.forEach(function (name) {
      return window.addEventListener(name, _this, false);
    });
  };

  Input.prototype.detach = function detach() {
    var _this2 = this;

    if (!this.attached) {
      return;
    }
    this.attached = false;
    window.cancelAnimationFrame(this.tickInterval);
    EVENTS.forEach(function (name) {
      return window.removeEventListener(name, _this2, false);
    });
  };

  Input.prototype.handleEvent = function handleEvent(event) {
    event.preventDefault();
    var method = EVENT_MAP[event.type];
    var touches = HAS_TOUCH ? event.changedTouches : [event];
    for (var i = 0, l = touches.length; i < l; i++) {
      var touch = touches[i];
      if (method === 'start') {
        var _state = this.pooledTouches.pop() || new _touchJs2['default'](this);
        _state.fromTouch(touch);
        this.actives.set(_state.id, _state);
        this.touches.add(_state);
        continue;
      }
      var id = touch.identifier || 0;
      if (!this.actives.has(id)) {
        continue;
      }
      var state = this.actives.get(id);
      if (method === 'end') {
        state.end();
        this.actives['delete'](state.id);
        continue;
      }
      state.move(touch);
    }
  };

  Input.prototype.tick = function tick() {
    var _this3 = this;

    this.tickInterval = window.requestAnimationFrame(this.tickBound);
    this.touches.forEach(function (touch) {
      if (touch.isFinal) {
        touch['delete']();
        _this3.touches['delete'](touch);
        _this3.pooledTouches.push(touch);
        return;
      }
      touch.tick();
    });
  };

  return Input;
})(_eventemitter32['default']);

exports['default'] = new Input();
module.exports = exports['default'];
},{"./polyfill.js":4,"./touch.js":5,"eventemitter3":1}],4:[function(require,module,exports){
'use strict';

if (!('performance' in window)) {
  window.performance = window.webkitPerformance || {};
}

if (!('now' in performance)) {
  performance.now = function () {
    return Date.now();
  };
}
},{}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _NEXT_PHASE, _EVENT_MAP;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _eventemitter3 = require('eventemitter3');

var _eventemitter32 = _interopRequireDefault(_eventemitter3);

var _vec2dJs = require('./vec2d.js');

var _vec2dJs2 = _interopRequireDefault(_vec2dJs);

var PHASES = {
  // finger touched the screen.
  BEGAN: 'began',
  // finger moved on the screen.
  MOVED: 'moved',
  // finger is touching the screen but hasn't moved.
  STATIONARY: 'stationary',
  // finger was lifted from the screen. This is the final phase of a touch.
  ENDED: 'ended',
  // The system cancelled tracking for the touch.
  CANCELED: 'canceled',
  // Internal
  BEGIN: 'willBegin',
  // Internal
  END: 'willEnd'
};

var NEXT_PHASE = (_NEXT_PHASE = {}, _NEXT_PHASE[PHASES.BEGIN] = PHASES.BEGAN, _NEXT_PHASE[PHASES.BEGAN] = PHASES.STATIONARY, _NEXT_PHASE[PHASES.END] = PHASES.ENDED, _NEXT_PHASE);

var EVENT_MAP = (_EVENT_MAP = {}, _EVENT_MAP[PHASES.BEGAN] = 'touchBegan', _EVENT_MAP[PHASES.STATIONARY] = 'touchStationary', _EVENT_MAP[PHASES.MOVED] = 'touchMoved', _EVENT_MAP[PHASES.ENDED] = 'touchEnded', _EVENT_MAP['deleted'] = 'touchDeleted', _EVENT_MAP);

var Touch = (function (_EventEmitter) {
  _inherits(Touch, _EventEmitter);

  function Touch(input) {
    _classCallCheck(this, Touch);

    _EventEmitter.call(this);
    // Parent Input reference
    this.input = input;
    // Unique index for the touch.
    this.id = 0;
    // Describes the phase of the touch.
    this.phase = '';
    // Last tick
    this.time = 0.0;
    // Start tick
    this.startTime = 0.0;
    // Amount of time that has passed since the last frame in Touch values.
    this.previousTime = 0.0;
    // Position of the touch in pixel coordinates.
    this.position = _vec2dJs2['default'].create(0, 0);
    // Start position
    this.startPosition = _vec2dJs2['default'].create(0, 0);
    // Position for last frame.
    this.previousPosition = _vec2dJs2['default'].create(0, 0);
    // Positions since last tick
    this.positions = new Set();
    // Waiting for next requestAnimationFrame
    this.didUpdate = false;
    // Custom details
    this.details = null;
  }

  Touch.prototype.fromTouch = function fromTouch(touch) {
    this.id = touch.identifier || 0;
    this.startTime = performance.now();
    this.time = this.startTime;
    this.startPosition[0] = touch.pageX;
    this.startPosition[1] = touch.pageY;
    this.position.set(this.startPosition);
    this.previousPosition.set(this.startPosition);
    this.phase = PHASES.BEGIN;
  };

  Touch.prototype.tick = function tick() {
    this.previousTime = this.time;
    this.time = performance.now();
    var emit = false;
    if (NEXT_PHASE[this.phase]) {
      this.phase = NEXT_PHASE[this.phase];
      emit = true;
    } else if (this.didMove) {
      // FIXME: Does always phase into STATIONARY even though it moved
      emit = true;
      if (this.phase !== PHASES.MOVED) {
        this.phase = PHASES.MOVED;
      }
    }
    if (emit) {
      this.emit(this.phase);
    }
    this.didUpdate = false;
    this.didMove = false;
  };

  Touch.prototype.move = function move(touch) {
    this.markUpdated();
    this.didMove = true;
    this.position[0] = touch.pageX;
    this.position[1] = touch.pageY;
    this.positions.add(_vec2dJs2['default'].create(this.position[0], this.position[1]));
  };

  Touch.prototype.end = function end() {
    this.markUpdated();
    this.phase = PHASES.END;
  };

  Touch.prototype.markUpdated = function markUpdated() {
    if (this.didUpdate) {
      return;
    }
    this.didUpdate = true;
    _vec2dJs2['default'].freeAll(this.positions);
    this.previousPosition.set(this.position);
  };

  Touch.prototype.emit = function emit(eventName) {
    var payload = { touch: this };
    _EventEmitter.prototype.emit.call(this, eventName, payload);
    this.input.emit(EVENT_MAP[eventName], payload);
  };

  Touch.prototype['delete'] = function _delete() {
    this.emit('deleted');
    // Remove event listeners from EventEmitter
    this.removeAllListeners();
    _vec2dJs2['default'].freeAll(this.positions);
    this.details = null;
  };

  _createClass(Touch, [{
    key: 'deltaTime',
    get: function get() {
      return this.time - this.previousTime;
    }
  }, {
    key: 'isFinal',
    get: function get() {
      return this.phase === PHASES.ENDED;
    }
  }]);

  return Touch;
})(_eventemitter32['default']);

exports['default'] = Touch;
module.exports = exports['default'];
},{"./vec2d.js":6,"eventemitter3":1}],6:[function(require,module,exports){
// Pooled 2d vectors
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vec2d = (function () {
  function Vec2d() {
    _classCallCheck(this, Vec2d);

    this.pool = [];
  }

  Vec2d.prototype.create = function create(x, y) {
    var result = this.pool.pop() || new Uint32Array(2);
    result[0] = x;
    result[1] = y;
    return result;
  };

  Vec2d.prototype.free = function free(vec2d) {
    this.pool.push(vec2d);
  };

  Vec2d.prototype.freeAll = function freeAll(all) {
    all.forEach(this.free, this);
    all.clear();
  };

  return Vec2d;
})();

exports["default"] = new Vec2d();
module.exports = exports["default"];
},{}]},{},[2])(2)
});