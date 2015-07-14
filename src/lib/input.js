import EventEmitter from 'eventemitter3';
import './polyfill.js';
import Touch from './touch.js';

const HAS_TOUCH = 'ontouchstart' in window;
const EVENT_MAP = HAS_TOUCH ? {
  touchstart: 'start',
  touchmove: 'move',
  touchend: 'end',
  touchcancel: 'end',
} : {
  mousedown: 'start',
  mousemove: 'move',
  mouseup: 'end',
};
const EVENTS = Object.keys(EVENT_MAP);

class Input extends EventEmitter {
  constructor() {
    super();
    this.touches = new Set();
    this.actives = new Map();
    this.tickBound = this.tick.bind(this);
    this.tickInterval = 0;
    this.pooledTouches = [];
  }

  attach() {
    if (this.attached) {
      return;
    }
    this.attached = true;
    this.tickInterval = window.requestAnimationFrame(this.tickBound);
    EVENTS.forEach((name) => window.addEventListener(name, this, false));
  }

  detach() {
    if (!this.attached) {
      return;
    }
    this.attached = false;
    window.cancelAnimationFrame(this.tickInterval);
    EVENTS.forEach((name) => window.removeEventListener(name, this, false));
  }

  handleEvent(event) {
    event.preventDefault();
    const method = EVENT_MAP[event.type];
    const touches = HAS_TOUCH ? event.changedTouches : [event];
    for (let i = 0, l = touches.length; i < l; i++) {
      const touch = touches[i];
      if (method === 'start') {
        const state = this.pooledTouches.pop() || new Touch(this);
        state.fromTouch(touch);
        this.actives.set(state.id, state);
        this.touches.add(state);
        continue;
      }
      const id = touch.identifier || 0;
      if (!this.actives.has(id)) {
        continue;
      }
      const state = this.actives.get(id);
      if (method === 'end') {
        state.end();
        this.actives.delete(state.id);
        continue;
      }
      state.move(touch);
    }
  }

  tick() {
    this.tickInterval = window.requestAnimationFrame(this.tickBound);
    this.touches.forEach((touch) => {
      if (touch.isFinal) {
        touch.delete();
        this.touches.delete(touch);
        this.pooledTouches.push(touch);
        return;
      }
      touch.tick();
    });
  }
}

export default new Input();
