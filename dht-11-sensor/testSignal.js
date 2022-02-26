const GPIO = require("onoff").Gpio;

const DHT11_PIN = 4;

const openPins = [];

const bits = [];

console.log(`Opening GPIO port ${DHT11_PIN}`);
const pin = new GPIO(DHT11_PIN, "in", "both");
openPins.push(pin);

pin.watch((err, val) => {
  if (err) {
    pin.unwatchAll();
    console.error(err);
    process.exit(1);
  }
  if (val === 1) {
    lastHigh = micros();
    process.stdout.write("╱▔");
  } else {
    const highDuration = micros() - lastHigh;
    const bit = highDuration > 70 ? 1 : 0;
    if (bit) {
      process.stdout.write("▔▔");
    }

    process.stdout.write("╲▁");
    bits.push(bit);
    if (bits.length >= 40) {
      pin.unwatchAll();
      resolve(0);
    }
  }
});
process.stdout.write("~");
waitForHigh(pin, 15000000, "~");
process.stdout.write("▔╲▁");
pin.setDirection("out");
setLowForMicros(pin, 1000000);
process.stdout.write("╱▔");
setHighForMicros(pin, 40);
pin.setDirection("in");
/*
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
  const pin = new GPIO(pinNumber, "in");
  openPins.push(pin);

  return openComms(pin);
}

function openComms(pin) {
  return new Promise((resolve, reject) => {
    const bits = [];
    pin.setDirection("in");
    pin.watch((err, val) => {
      if (err) {
        pin.unwatchAll();
        reject(err);
      }
      console.log("value: " + val);
      // if (val === 1) {
      //   lastHigh = micros();
      //   process.stdout.write("╱▔");
      // } else {
      //   const highDuration = micros() - lastHigh;
      //   const bit = highDuration > 70 ? 1 : 0;
      //   if (bit) {
      //     process.stdout.write("▔▔");
      //   }
      //   bits.push(bit);
      //   if (bits.length >= 40) {
      //     pin.unwatchAll();
      //     resolve(0);
      //   }
      // }
    });

    // process.stdout.write("~");
    // waitForHigh(pin, 15000000, "~");
    // process.stdout.write("▔╲▁");
    // pin.setDirection("out");
    // setLowForMicros(pin, 1000000);
    // process.stdout.write("╱▔");
    // setHighForMicros(pin, 40);
    // pin.setDirection("in");
  });
}





*/
function setLowForMicros(pin, durationMicros) {
  pin.writeSync(0);
  waitMicroSecs(durationMicros);
}
function setHighForMicros(pin, durationMicros) {
  pin.writeSync(1);
  waitMicroSecs(durationMicros);
}
function waitMicroSecs(delayMicroseconds) {
  const currentMicros = micros();
  while (micros() - currentMicros < delayMicroseconds) {
    continue;
  }
}
function micros() {
  return Number(process.hrtime.bigint() / 1000n);
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
