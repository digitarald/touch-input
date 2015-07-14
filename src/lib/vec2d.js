// Pooled 2d vectors
class Vec2d {
  constructor() {
    this.pool = [];
  }

  create(x, y) {
    const result = this.pool.pop() || new Uint32Array(2);
    result[0] = x;
    result[1] = y;
    return result;
  }

  free(vec2d) {
    this.pool.push(vec2d);
  }

  freeAll(all) {
    all.forEach(this.free, this);
    all.clear();
  }
}

export default new Vec2d();
