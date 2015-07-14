
touchInput.attach();

var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');

// Fullsized canvas
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.requestAnimationFrame(function tick() {
  // Fade out old canvas state
  context.save();
  context.fillStyle = '#fff';
  context.globalAlpha = 0.05;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();

  context.save();
  context.fillStyle = '#000';
  context.strokeStyle = '#000';
  context.lineWidth = 3;
  // Draw each touch
  touchInput.touches.forEach(function(touch) {
    var position = touch.position;
    if (touch.phase === 'moved') {
      context.beginPath();
      context.moveTo(touch.previousPosition[0], touch.previousPosition[1]);
      touch.positions.forEach(function(between) {
        context.lineTo(between[0], between[1]);
        context.arc(between[0], between[1], 3, 0, Math.PI * 2, true);
        context.moveTo(between[0], between[1]);
      });
      context.closePath();
      context.stroke();
    }
    context.beginPath();
    context.arc(position[0], position[1], 10, 0, Math.PI * 2, true);
    context.closePath();
    context.stroke();
    if (touch.phase === 'moved') {
      context.fill();
    }
  });
  context.restore();

  window.requestAnimationFrame(tick);
});
