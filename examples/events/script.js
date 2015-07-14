
touchInput.attach();

function updateOne(event) {
  var touch = event.touch;
  var position = touch.position;
  var css = 'translate(' + position[0] + 'px, ' + position[1] + 'px)';
  touch.details.style.transform = css;
  touch.details.style.webkitTransform = css;
}

touchInput.on('touchBegan', function(event) {
  var touch = event.touch;
  touch.details = document.createElement('div');
  document.body.appendChild(touch.details);
  updateOne(event);
  touch.on('moved', updateOne);
  touch.on('ended', function() {
    document.body.removeChild(touch.details);
  });
});
