const mcpadc = require("mcp-spi-adc");
const colors = require("ansi-colors");
const cliProgress = require("cli-progress");
const humanizeDuration = require("humanize-duration");
const R2 = 2000;

const b1 = new cliProgress.SingleBar({
  format:
    "Warming up Sensor |" +
    colors.cyan("{bar}") +
    "| {percentage}% || {time} remaining || r0: {r0}",
  barCompleteChar: "\u2588",
  barIncompleteChar: "\u2591",
  hideCursor: true,
});

const coSensor = mcpadc.open(0, { speedHz: 20000 }, (err) => {
  if (err) throw err;
  const initialMS = new Date().getTime();
  const targetMS = initialMS + 28800000; // 8 hours

  b1.start(28800000, 0, {
    time: "8 hours",
    r0: "N/A",
  });
  setInterval((_) => {
    coSensor.read((err, reading) => {
      if (err) throw err;
      const currentMS = new Date().getTime();
      const elapsed = currentMS - initialMS;
      const remaining = targetMS - currentMS;
      const r0 = detectR0(reading.value);
      b1.update(elapsed, {
        time: humanizeDuration(remaining),
        r0,
      });
      if (remaining <= 0) {
        console.log("Warming finished, final R0 is " + r0);
        process.exit(0);
      }
    });
  }, 1000);
});

function detectR0(volts) {
  const RS_gas = (5 * R2) / volts - R2;
  const R0 = RS_gas / 1;

  return R0;
}
