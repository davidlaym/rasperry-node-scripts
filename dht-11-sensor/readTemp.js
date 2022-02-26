const GPIO = require("onoff").Gpio;

const DHT11_PIN = 4;

const openPins = [];

readDHT11(DHT11_PIN)
  .then(([rh, temp]) => {
    console.log(`Temp: ${temp} C | Humidity: ${rh}%`);
  })
  .catch((err) => {
    console.log();
    console.error(err.message);
  })
  .finally(() => {
    cleanUp();
  });

function readDHT11(pinNumber) {
  console.log(`Opening GPIO port ${DHT11_PIN}`);
  const pin = new GPIO(pinNumber, "in", "both");
  openPins.push(pin);

  return handshake(pin).then(readBits).then(bitsToData);
}

function bitsToData(bits) {
  const [rhInt, rhDec, tempInt, tempDec, checkSum] = chunkify(bits, 8).map(
    (byte) => parseInt(byte.join(""))
  );

  const sum = (rhInt + rhDec + tempInt + tempDec).toString(2).substring(-1, 8);
  if (sum !== checkSum) {
    throw new Error("checksum failed");
  }
  return Promise.resolve([
    parseFloat(`${rhInt}.${rhDec}`),
    parseFloat(`${tempInt}.${tempDec}`),
  ]);
}

function readBits(pin) {
  pin.setDirection("in");
  return new Promise((resolve, reject) => {
    console.log(`Reading data`);
    const lastHigh = 0;
    const bits = [];
    process.stdout.write("Data: ");
    pin.watch((err, val) => {
      if (err) {
        pin.unwatchAll();
        reject(err);
      }
      if (val === 1) {
        lastHigh = micros();
      } else {
        const highDuration = micros() - lastHigh;
        const bit = highDuration > 70 ? 1 : 0;
        process.stdout.write(bit);
        bits.push(bit);
        if (bits.length >= 40) {
          pin.unwatchAll();
          resolve(bits);
        }
      }
    });
  });
}

function handshake(pin) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Starting Handshake`);
      process.stdout.write("~");
      waitForHigh(pin, 15000000, "~");
      process.stdout.write("▔╲▁");
      setLowForMicros(pin, 30000);
      process.stdout.write("╱▔");
      setHighForMicros(pin, 20);
      waitForLow(pin, 15000000);
      process.stdout.write("╲▁");
      waitForHigh(pin, 100);
      process.stdout.write("╱▔");
      waitForLow(pin, 15000000);
      process.stdout.write("╲▁/n");
      console.log(`Handshake Successful`);
      resolve(pin);
    } catch (err) {
      reject(err);
    }
  });
}
function waitForHigh(pin, timeoutMicros, feedback) {
  pin.setDirection("in");
  const startingMicros = micros();
  const feedbackThreshold = 1000000;
  let feedbackCounter = 0;
  while (pin.readSync() === 0) {
    const currentMicros = micros() - startingMicros;
    if (timeoutMicros && currentMicros > timeoutMicros) {
      throw new Error("timeout expired waiting for high");
    }
    if (currentMicros > feedbackCounter * feedbackThreshold) {
      feedbackCounter++;
      process.stdout.write(feedback || "▁");
    }
    continue;
  }
}
function waitForLow(pin, timeoutMicros, feedback) {
  pin.setDirection("in");
  const startingMicros = micros();
  const feedbackThreshold = 1000000;
  let feedbackCounter = 0;
  while (pin.readSync() === 1) {
    const currentMicros = micros() - startingMicros;
    if (timeoutMicros && currentMicros > timeoutMicros) {
      throw new Error("timeout expired waiting for low");
    }
    if (currentMicros > feedbackCounter * feedbackThreshold) {
      feedbackCounter++;
      process.stdout.write(feedback || "▔");
    }
    continue;
  }
}

function setLowForMicros(pin, durationMicros) {
  pin.setDirection("out");
  pin.writeSync(0);
  waitMicroSecs(durationMicros);
}
function setHighForMicros(pin, durationMicros) {
  pin.setDirection("out");
  pin.writeSync(1);
  waitMicroSecs(durationMicros);
}

function micros() {
  return Number(process.hrtime.bigint() / 1000n);
}

function waitMicroSecs(delayMicroseconds) {
  const currentMicros = micros();
  while (micros() - currentMicros < delayMicroseconds) {
    continue;
  }
  // console.log(
  //   "waited for " +
  //     (micros() - currentMicros) +
  //     " microsecs (of " +
  //     delayMicroseconds +
  //     " requested)"
  // );
}

process.on("SIGINT", (_) => {
  cleanUp();
});

function cleanUp() {
  if (openPins && openPins.length) {
    openPins.forEach((port) => {
      port.unwatchAll();
      port.unexport();
    });
  }
}
function chunkify(arr, len) {
  var chunks = [],
    i = 0,
    n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
}
