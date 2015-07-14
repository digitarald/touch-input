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
    this.touches = new Map();
    this.tickBound = this.tick.bind(this);
    this.tickInterval = 0;
    this.touchesPool = [];
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
        const state = this.touchesPool.pop() || new Touch(this);
        state.fromTouch(touch);
        this.touches.set(state.id, state);
        return;
      }
      const state = this.touches.get(touch.identifier || 0);
      if (!state) {
        return;
      }
      if (method === 'end') {
        state.end();
        return;
      }
      state.move(touch);
    }
  }

  tick() {
    this.tickInterval = window.requestAnimationFrame(this.tickBound);
    this.touches.forEach((touch) => {
      if (touch.isFinal) {
        touch.delete();
        this.touches.delete(touch.id);
        this.touchesPool.push(touch);
        return;
      }
      touch.tick();
    });
  }
}

export default new Input();
