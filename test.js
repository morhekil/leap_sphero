var Leap = require('leapjs')
var Sylv = require('sylvester')
var SpheroBot = require('./sphero.js')

var verbose_debug = true;

Leap.loop(function(frame, done) {
  handle_frame(frame);
  done() // if you don't invoke this, you won't get more events
})

var sphero = new SpheroBot.Sphero();
var ball = null;

function no_callback() {};
function print_debug(str) {
  if (verbose_debug) { process.stdout.write(str); }
}

function sphero_init(the_ball) {
  ball = the_ball;
  ball.setRGBLED(0, 255, 0, false);
  ball.setBackLED(1, no_callback);
};

sphero.on('connected', sphero_init);
sphero.connect();

function sphero_stop() {
  if (ball) {
    ball.setBackLED(0, no_callback);
    ball.roll(0, 0, no_callback);
  }
}

function normal_to_sphero_speed(vector) {
  var speed = vector.elements[2];
  if (speed < 0.1) { speed = 0 };
  return speed;
}

function normal_to_sphero_heading(vector) {
  var heading = Math.round(-180 * vector.elements[0]);
  print_debug("heading raw: " + heading + "      ");

  // Damping controls
  heading = Math.round(heading / 10);
  if (Math.abs(heading) < 4) { heading = 0; }
  print_debug("damped: " + heading + "      ")

  if (heading < 0) { heading = 360 + heading; }
  return heading;
}

function sphero_control_by_normal(normal) {
  var speed = normal_to_sphero_speed(normal);
  var heading = normal_to_sphero_heading(normal);

  print_debug("speed: " + Math.round(speed*100) + "     " +
              "heading: " + Math.round(heading) + "    \r");

  if (ball) {
    ball.setHeading(heading, no_callback);
    ball.roll(heading, speed, no_callback);
  }
}

function handle_frame(frame) {
  if (frame.hands.length > 0) {
    var hand = frame.hands[0];
    var normal = Sylv.Vector.create(hand.palmNormal);

    sphero_control_by_normal(normal);
  }
}

function print_vector(name, vector) {
  var axes = { x: 0, y: 1, z: 2 }
  print_debug(name + ' = ');
  for (var axis in axes) {
    var value = vector.elements[axes[axis]];
    // var degree = Math.round(180 * value);
    print_debug(axis + ': ' + Math.round(100*value) + "       ");
  }
}

process.on( 'SIGINT', function() {
  console.log("\nshutting down in 3 seconds...");
  sphero_stop();
  setTimeout(function() { process.exit() }, 3000);
})
