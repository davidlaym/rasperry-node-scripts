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
  
  
for (const  j=0; j< 5; j++){     // redo it for the 5 Bytes (40 Databits /8 = 5)
  for (const  i=0; i< 8; i++) {bitWrite(DHTData[j], 7-i, Result[i+2+(j*8)]);}  // Create 5 Databytes from the 40 Databits (Ignoring the 2 first Databits)
  
  }

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


process.on('SIGINT', _ => {
  cleanUp();
});

function cleanUp() {
  openPorts.forEach(port => {
    port.unexport();
  });
}