var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');

var SpheroCollection = exports.Sphero = function SpheroCollection() {
  if (!this instanceof SpheroCollection) {
    return new SpheroCollection();
  }
  var self = this;
  this.balls = [];
  return this;
};
util.inherits(SpheroCollection, events.EventEmitter);
SpheroCollection.prototype.connect = function() {
  var self = this;

  var setupConnection = function(dev){
    var b = new Sphero(dev);
    b.on("open", function(err, ret) {
      self.balls.push(b);
      self.emit('connected', b);
    });
  };

  if (process.platform === 'win32') {
    serialport.list(function (err, ports) {
      ports.forEach(function(port) {
        setupConnection(port.comName);
      });
    });
  }else{
    fs.readdir('/dev', function onDevicesListed(err, devs) {
      if (err) {
        self.emit("error", err);
      }else {
        devs.filter(function looksLikeSphero(dev) {
          return /cu.*sphero/i.test(dev);
        }).map(function addDirectory(dev) {
          dev = path.join('/dev', dev);
          setupConnection(dev);
        });
      }
    });
  }
};


SpheroCollection.prototype.close = function(){
  this.balls.forEach(function(ball){
    ball.close();
  });
  return this;
};
SpheroCollection.prototype.setRGBLED = function(r, g, b, persist, callback){
  this.balls.forEach(function(ball){
    ball.setRGBLED(r,g,b,persist, callback);
  });
  return this;
};
SpheroCollection.prototype.setBackLED = function(l, callback){
  this.balls.forEach(function(ball){
    ball.setBackLED(l, callback);
  });
  return this;
}
SpheroCollection.prototype.setHeading = function(heading, callback) {
  this.balls.forEach(function(ball){
    ball.setHeading(heading, callback);
  });
  return this;
}
SpheroCollection.prototype.roll = function(heading, speed, callback) {
  this.balls.forEach(function(ball){
    ball.roll(heading, speed, callback);
  });
  return this;
}

var Sphero = function(dev){
  if (!this instanceof Sphero) {
    return new Sphero(dev);
  }
  this.requests = {};
  var self = this;
  this.origin = dev;
  try {
    this.dev = new SerialPort(dev);
  } catch(e) {
    self.emit('error', e);
  }
  this.dev.on('open', function () {
    self.emit('open');
  });
  this.dev.on('error', function (e) {
    self.emit('error', e);
  });
  this.dev.on('close', function (e) {
    self.emit('close');
  });
  this.dev.on('end', function (e) {
    self.emit('end');
  });
  this.incomingBuffer = null;
  this.dev.on('data', function (data) {
    if (Buffer.isBuffer(self.incomingBuffer)) {
      var oldBuffer = self.incomingBuffer;
      self.incomingBuffer = new Buffer(oldBuffer.length + data.length);
      oldBuffer.copy(self.incomingBuffer);
      data.copy(self.incomingBuffer, oldBuffer.length);
    }
    else {
      self.incomingBuffer = new Buffer(data.length);
      data.copy(self.incomingBuffer);
    }
    self._checkIncomingBuffer();
  });
  return this;
}
util.inherits(Sphero, events.EventEmitter);

Sphero.prototype.close = function () {
  this.setDataStreaming();
  this.dev.close();
}
Sphero.prototype.device = {
  core: {
    DID: 0x00,
    commands: {
      PING: {
        CID: 0x01
      },
      GET_BLUETOOTH_INFO: {
        CID: 0x11
      }
    }
  },
  bootloader: {
    DID: 0x01
  },
  sphero: {
    DID: 0x02,
    commands: {
      SET_DATA_STREAMING: {
        CID: 0x11
      },
      SET_RGB_LED: {
        CID: 0x20
      },
      SET_BACK_LED: {
        CID: 0x21
      },
      ROLL: {
        CID: 0x30
      },
      SET_STABILITZATION: {
        CID: 0x02
      },
      SET_SELF_LEVEL: {
        CID: 0x09
      },
      SET_HEADING: {
        CID: 0x01
      }
    }
  }
}
Sphero.prototype.sensors = {
  gyro_h: {
    MASK1: 0x000000001
  },
  gyro_m: {
    MASK1: 0x000000002
  },
  gyro_l: {
    MASK1: 0x000000004
  },
  left_motor_emf: {
    MASK1: 0x000000020
  },
  right_motor_emf: {
    MASK1: 0x000000040
  },
  magnometer_z: {
    MASK1: 0x000000080
  },
  magnometer_y: {
    MASK1: 0x000000100
  },
  magnometer_x: {
    MASK1: 0x000000200
  },
  gyro_z: {
    MASK1: 0x000000400
  },
  gyro_y: {
    MASK1: 0x000000800
  },
  gyro_x: {
    MASK1: 0x000001000
  },
  accelerometer_z: {
    MASK1: 0x000002000
  },
  accelerometer_y: {
    MASK1: 0x000004000
  },
  accelerometer_x: {
    MASK1: 0x000008000
  },
  imu_yaw: {
    MASK1: 0x000010000
  },
  imu_roll: {
    MASK1: 0x000020000
  },
  imu_pitch: {
    MASK1: 0x000040000
  }

}
Sphero.prototype.setDataStreaming = function setDataStreaming(sensors, hertz, frames, count, callback) {
  var mask1 = 0x0;
  var mask2 = 0x0;
  sensors.forEach(function (sensor) {
    if (sensor.MASK1) {
      mask1 |= sensor.MASK1;
    }
    if (sensor.MASK2) {
      mask2 |= sensor.MASK2;
    }
  })
  var n = hertz ? 400 / hertz : 0;
  frames = frames | 0;
  var buffer = new Buffer([0,0,  0,0,  0,0,0,0,  count | 0,  0,0,0,0]);
  buffer.writeUInt16BE(n, 0);
  buffer.writeUInt16BE(frames, 2);
  buffer.writeUInt32BE(mask1, 4);
  buffer.writeUInt32BE(mask2, 9);
  this._send(this.device.sphero.DID, this.device.sphero.commands.SET_DATA_STREAMING.CID, buffer, callback);
  return callback;
}
Sphero.prototype.ping = function ping(callback) {
  this._send(this.device.core.DID, this.device.core.commands.PING.CID, null, callback);
  return callback;
}
Sphero.prototype.getBluetoothInfo = function getBluetoothInfo(callback) {
  this._send(this.device.core.DID, this.device.core.commands.GET_BLUETOOTH_INFO.CID, null, callback);
  return callback;
}
Sphero.prototype.setRGBLED = function setRGB(r, g, b, persist, callback) {
  this._send(this.device.sphero.DID, this.device.sphero.commands.SET_RGB_LED.CID, new Buffer([r & 0xff, g & 0xff, b & 0xff, (persist && 0x01) | 0]), callback)
  return callback;
}
Sphero.prototype.setBackLED = function setRGB(l, callback) {
  l = l >1? 1:l;
  l = l * 255;
  this._send(this.device.sphero.DID, this.device.sphero.commands.SET_BACK_LED.CID, new Buffer([l & 0xff]), callback)
  return callback;
}
Sphero.prototype.setHeading = function setHeading(heading, callback) {
  this._send(this.device.sphero.DID, this.device.sphero.commands.SET_HEADING.CID, new Buffer([(heading & 0xff00) >> 8, heading & 0xff]), callback);
  return callback;
}
Sphero.prototype.roll = function roll(heading, speed, callback) {
  speed = speed >1? 1:speed;
  speed = speed * 255;
  this._send(this.device.sphero.DID, this.device.sphero.commands.ROLL.CID, new Buffer([speed & 0xff, (heading & 0xff00) >> 8, heading & 0xff, 0x01]), callback);
  return callback;
}
Sphero.prototype.setStabilization = function setStabilization(shouldStabilize, callback) {
  this._send(this.device.sphero.DID, this.device.sphero.commands.SET_STABILITZATION.CID, new Buffer([(shouldStabilize && 0x01) | 0]), callback);
  return callback;
}
Sphero.prototype._setRequest = function _setRequest(callback) {
  for (var i = 0; i < 256; i++) {
    if (!this.requests[i]) {
      this.requests[i] = callback;
      return i;
    }
  };
  throw new Error('SEQ numbers full');
}

Sphero.prototype._checkIncomingBuffer = function _checkIncomingBuffer() {
  while (this.incomingBuffer) {
    var buffer = this.incomingBuffer;
    if (buffer.length < 2) {
      return;
    }
    var SOP1 = buffer[0];
    if (SOP1 !== 0xff) {
      this.emit('error', new Error('SOP1 must be FFh got ' + SOP1));
      return;
    }
    var SOP2 = buffer[1];
    if (SOP2 === 0xff) {
      if (buffer.length < 6) {
        return;
      }
      var DLEN = buffer[4];
      if (buffer.length < DLEN + 5) {
        return;
      }
      var MRSP = buffer[2];
      var SEQ  = buffer[3];
      var startOfData = 5;
      var endOfData = startOfData + (DLEN - 1);
      var endOfPacket = endOfData + 1;
      var DATA = buffer.slice(startOfData, endOfData);
      var sum  = Array.prototype.slice.call(buffer, 2, endOfData);
      sum = sum.reduce(function(a, b) {
        return a + b;
      }, 0);
      var CHK  = buffer[endOfData];
      if (CHK == ((sum % 256) ^ 0xff)) {
        var msg = {
          SOP2: SOP2,
          MRSP: MRSP,
          SEQ: SEQ,
          DATA: DATA
        };
        this.emit('message', msg);
        if (SOP2 !== 0xfe) {
          if (this.requests[SEQ]) {
            this.requests[SEQ](null, msg);
            delete this.requests[SEQ];
          }
        }
      }
      this.incomingBuffer = this.incomingBuffer.length >= endOfPacket ? this.incomingBuffer.slice(endOfPacket) : null;
    }
    else if (SOP2 === 0xfe) {
      if (buffer.length < 7) {
        return;
      }
      var ID_CODE = buffer[2];
      var DLEN = buffer.readUInt16BE(3);
      if (buffer.length < DLEN + 5) {
        return;
      }
      var startOfData = 5;
      var endOfData = startOfData + (DLEN - 1);
      var endOfPacket = endOfData + 1;
      var DATA = buffer.slice(startOfData, endOfData);
      var msg = {
        SOP2: SOP2,
        ID_CODE: ID_CODE,
        DATA: DATA
      };
      this.emit('notification', msg);
      this.incomingBuffer = this.incomingBuffer.length > endOfPacket  ? this.incomingBuffer.slice(endOfPacket) : null;
    }
    else {
      this.emit('error', new Error('WTF IS IN SOP2!?'));
    }
  }
}
Sphero.prototype._send = function _send(DID, CID, buffer, callback) {
  buffer = buffer || new Buffer(0);
  var toSend = new Buffer(6 + buffer.length + 1);
  //
  // Set SOP1
  //
  toSend[0] = 0xff;
  buffer.copy(toSend, 6);
  toSend[1] = callback ? 0xff : 0xfe;
  toSend[2] = DID;
  toSend[3] = CID;
  toSend[4] = callback ? this._setRequest(callback) : 0x00;
  //toSend[4] = 0x00;
  // TODO: Refactor the Sphero device callbacks (for now, we're ignoring them, as they are not used)
  //
  // Set DLEN
  //
  toSend[5] = buffer.length + 1;
  var DIDtoCHK = Array.prototype.slice.call(toSend, 2, toSend.length - 1);
  var sum = DIDtoCHK.reduce(function (a,b) {
    return a+b;
  }, 0);
  //
  // Set CHK
  //
  toSend[toSend.length - 1] = (sum & 0xff) ^ 0xff;
  return this.dev.write(toSend);
}

Sphero.prototype.toString = function toString() {
  return '[object Sphero]';
}

