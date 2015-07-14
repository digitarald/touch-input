if (!('performance' in window)) {
  window.performance = window.webkitPerformance || {};
}

if (!('now' in performance)) {
  performance.now = () => Date.now();
}
