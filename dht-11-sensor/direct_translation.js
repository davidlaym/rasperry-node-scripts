const Gpio = require('onoff').Gpio;

const DHT11pin = 14;
const humidity, tempInt, tempFrac = 0;
const dhtError = false;
const openPorts = [];

function micros() {
  return process.hrtime.bigint()/1000;
}

function waitMicroSecs(delayMicroseconds) {
  const currentMicros = micros();
  while (micros() - currentMicros < delayValue) {
    continue;
  }
}

function readTemp() {

  const context = {
    dataArray:0,
    dataCounter:0,
    DHTData:[],
    blockDHT:false,
    dataTime: 0,
    result=[]
  }
  const dht11pinRef = new Gpio(DHT11pin, 'out');
  openPorts.push(dht11pinRef);
  
  enableSensor(dht11pinRef);
  readData(dht11pinRef, context);

  cleanUp();
}

function readData(dataPin, context) {
  dataPin.setDirection('in');
  dataPin.setEdge('raising');


  do {
    if (nextDatasetReady(dataPin, context)) {
      moveToNextDataset(dataPin, context);
    }
    if (dataPin.readSync()) {
      context.blockDHT = false;
    }
  } while ((micros() - context.dataTime) < 150);


  for (const i = 2; i < context.dataArray; i++) {
    if (context.result[i] <= 90) {
      context.result[i] = 0
    } else {
      Result[i] = 1
    };
  }
  
  const bytes = chunkify(context.result, 8);
  context.DHTData.push(bytes.map);
  
}


function chunkify(arr, len) {
  var chunks = [], i = 0, n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }
  return chunks;
}

function moveToNextDataset(_, context) {
  context.blockDHT = true;
  context.result[context.dataArray] = (micros() - context.dataTime);
  context.dataArray++;
  context.dataTime = micros();
}

function nextDatasetReady(dataPin, context) {
  return (dataPin.readSync() === 0 && blocked.blockDHT);
}

function enableSensor(dataPin) {
  console.log('enabling sensor');
  dataPin.writeSync(1);
  waitMicroSecs(250000);
  dataPin.writeSync(0);
  waitMicroSecs(30000);
  dataPin.writeSync(1);
  waitMicroSecs(50);
  dataPin.writeSync(0);
  console.log('sensor enabled');
}

