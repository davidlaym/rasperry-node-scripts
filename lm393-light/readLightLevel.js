const rpio = require("rpio");

function calculateLightLevel(analogReading) {
  return (1023 - analogReading) / 10.23;
}

function getReading() {
  const tx = Buffer.from([0x3, 0x0, 0x0, 0x0]);
  const rx = Buffer.alloc(4);
  let out;
  let j = 1;

  for (let i = 0; i < 128; i++, ++j) {
    tx[1] = i;
    rpio.spiTransfer(tx, rx, 4);
    out = (rx[2] << 1) | (rx[3] >> 7);
    process.stdout.write(out.toString(16) + (j % 16 == 0 ? "\n" : " "));
  }
}

rpio.spiBegin();
rpio.spiChipSelect(0);
rpio.spiSetClockDivider(128);

getReading();
rpio.spiEnd();
