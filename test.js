var Leap = require('leapjs')
var Sylv = require('sylvester')

Leap.loop(function(frame, done) {
  // do things
  // process.stdout.write('\u001B[2J\u001B[0;0f');
  // console.log(frame.hands);
  handle_frame(frame);
  done() // if you don't invoke this, you won't get more events
})

function handle_frame(frame) {
  if (frame.hands.length > 0) {
    var hand = frame.hands[0];
    handle_hand(hand);
  }
}

function print_vector(name, vector) {
  var axes = { x: 0, y: 1, z: 2 }
  process.stdout.write(name + ' = ');
  for (var axis in axes) {
    var value = vector[axes[axis]];
    // var degree = Math.round(180 * radian);
    process.stdout.write(axis + ': ' + Math.round(100*value) + "       ");
  }
}

function yaw(vector) {
  var v_elms = vector.elements;
  var projection = Sylv.Vector.create([0, v_elms[1], v_elms[2]]);
  print_vector("projection", projection.elements);
  var axis = Sylv.Vector.create([0, -1, 0]);
  var angle = vector.angleFrom(axis)
  if (v_elms[2] < 0) { angle = -angle };
  return angle;
}

function handle_hand(hand) {
  var normal = Sylv.Vector.create(hand.palmNormal);
  print_vector("normal", normal.elements);
  var yaw_rad = yaw(normal);
  var yaw_deg = yaw_rad * 180 / Math.PI;
  process.stdout.write('yaw: ' + Math.round(yaw_deg / 10) + '    ');
  process.stdout.write("\r");
}
