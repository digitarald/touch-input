import EventEmitter from 'eventemitter3';
import vec2d from './vec2d.js';

const PHASES = {
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
  END: 'willEnd',
};

const NEXT_PHASE = {
  [PHASES.BEGIN]: PHASES.BEGAN,
  [PHASES.BEGAN]: PHASES.STATIONARY,
  [PHASES.END]: PHASES.ENDED,
};

const EVENT_MAP = {
  [PHASES.BEGAN]: 'touchBegan',
  [PHASES.STATIONARY]: 'touchStationary',
  [PHASES.MOVED]: 'touchMoved',
  [PHASES.ENDED]: 'touchEnded',
  'deleted': 'touchDeleted',
};

export default class Touch extends EventEmitter {
  constructor(input) {
    super();
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
    this.position = vec2d.create(0, 0);
    // Start position
    this.startPosition = vec2d.create(0, 0);
    // Position for last frame.
    this.previousPosition = vec2d.create(0, 0);
    // Positions since last tick
    this.positions = new Set();
    // Waiting for next requestAnimationFrame
    this.didUpdate = false;
    // Custom details
    this.details = null;
  }

  get deltaTime() {
    return this.time - this.previousTime;
  }

  get isFinal() {
    return this.phase === PHASES.ENDED;
  }

  fromTouch(touch) {
    this.id = touch.identifier || 0;
    this.startTime = performance.now();
    this.time = this.startTime;
    this.startPosition[0] = touch.pageX;
    this.startPosition[1] = touch.pageY;
    this.position.set(this.startPosition);
    this.previousPosition.set(this.startPosition);
    this.phase = PHASES.BEGIN;
  }

  tick() {
    this.previousTime = this.time;
    this.time = performance.now();
    let emit = false;
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
  }

  move(touch) {
    this.markUpdated();
    this.didMove = true;
    this.position[0] = touch.pageX;
    this.position[1] = touch.pageY;
    this.positions.add(vec2d.create(this.position[0], this.position[1]));
  }

  end() {
    this.markUpdated();
    this.phase = PHASES.END;
  }

  markUpdated() {
    if (this.didUpdate) {
      return;
    }
    this.didUpdate = true;
    vec2d.freeAll(this.positions);
    this.previousPosition.set(this.position);
  }

  emit(eventName) {
    const payload = {touch: this};
    super.emit(eventName, payload);
    this.input.emit(EVENT_MAP[eventName], payload);
  }

  delete() {
    this.emit('deleted');
    // Remove event listeners from EventEmitter
    this.removeAllListeners();
    vec2d.freeAll(this.positions);
    this.details = null;
  }
}
