const mcpadc = require("mcp-spi-adc");
const R2 = 2000;
const R0 = 88530;
//const R0 = 70000;

console.log("Starting program, to finish press Ctr+C");

console.log("Opening SPI Sensor");
let warmed = false;

const coSensor = mcpadc.open(5, { speedHz: 20000 }, (err) => {
  if (err) throw err;
  console.log("Warming up sensor, Please keep it in clean air.../n/n");

  setInterval((_) => {
    coSensor.read((err, reading) => {
      if (err) throw err;
      if (!warmed) {
        const r0 = detectR0(reading.value);
        if (r0 >= R0) {
          warmed = true;
          console.log("Sensor Ready, measuring now.");
          console.log(`measured R0 is ${r0}`);
        }
      } else {
        const ppm = convertToPPM(reading.value, R0);
        console.log(`CO ppm: ${ppm}`);
      }
    });
  }, 1000);
});

function detectR0(volts) {
  const RS_gas = (5 * R2) / volts - R2;
  const R0 = RS_gas / 1;

  return R0;
}

process.on("SIGINT", () => {
  console.log("Program finished.");
  process.exit(0);
});

function convertToPPM(volts, r0) {
  const vcc = 5; // 5 volts vcc
  const rsGas = (vcc - volts) / volts;
  const rRatio = rsGas / r0;
  const x = 1538.46 * rRatio;
  return Math.pow(x, -1.709);
}
