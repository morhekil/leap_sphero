leap_sphero
===========

This is a Sunday night experiment in driving Sphero ball with a Leap controller.

Tilt your hand forward to make the ball go forward, tile it back to stop the back. Tilt left and right to turn the ball,
either when moving or standing in place.

I'm not quite happy with jerky turning, so improving this would probably be the next step, as well as adjusting the
damping (maybe make proportional to the tilt).

All credit for Sphero js API goes to https://github.com/mick/node-sphero - I had to inline it in this
project as I'm using node 0.10, and the original module has a dependency on old serialport module version which doesn't
compile under 0.10 anymore.

And, of course, huge kudos to people from @gosphero and @LeapMotion for making this awesome stuff possible.

Feel free to ask questions, if you're interested in any parts of what's done here - though I believe it's quite basic atm.


Quick Start
-----------

1. brew install nodejs
2. npm install leapjs
3. npm install sylvester

That should be all you need. Plug your Leap controller into a USB port, connect Sphero ball over bluetooh,
and start the script:

node leap_sphero.js

Tilt your hand and have fun.
