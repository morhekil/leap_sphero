/**
* Some vector math which I didn't need in the end, so just leaving it here
* for future reference
**/

function vector_roll(vector) {
  var v_elms = vector.elements;
  var projection = Sylv.Vector.create([v_elms[0], v_elms[1], 0]);
  print_vector("normal", vector);
  print_vector("roll_proj", projection);
  var axis = Sylv.Vector.create([0, -1, 0]);
  var angle = vector.angleFrom(axis)
  process.stdout.write("roll = " + Math.round(angle*180/Math.PI) + "   ")
  // if (v_elms[0] > 0) { angle = -angle };
  return angle;
}

function vector_yaw(vector) {
  var v_elms = vector.elements;
  var projection = Sylv.Vector.create([v_elms[0], 0, v_elms[2]]);
  var axis = Sylv.Vector.create([0, 0, -1]);
  var angle = vector.angleFrom(axis)
  if (v_elms[0] < 0) { angle = -angle };
  return angle;
}

function vector_pitch(vector) {
  var v_elms = vector.elements;
  var projection = Sylv.Vector.create([0, v_elms[1], v_elms[2]]);
  // print_vector("projection", projection.elements);
  var axis = Sylv.Vector.create([0, -1, 0]);
  var angle = vector.angleFrom(axis)
  if (v_elms[2] < 0) { angle = -angle };
  return angle;
}


