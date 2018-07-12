import { MongoClient } from 'mongodb';
import RestRequest from 'rest-request';
import { NeuralNetwork } from 'brain.js';

import { Layer, Network } from 'synaptic';

let inputLayer = new Layer(3);
let hiddenLayer = new Layer(5);
let outputLayer = new Layer(1);

inputLayer.project(hiddenLayer);
hiddenLayer.project(outputLayer);

let myNetwork = new Network({
	input: inputLayer,
	hidden: [hiddenLayer],
	output: outputLayer
});

let learningRate = 0.3;

let config = {
};
//create a simple recurrent neural network
//var net = new brain.recurrent.LSTM(config);
let net = new NeuralNetwork(config);


const load = async () => {
  const a = await Promise.resolve(5);
  const b = await Promise.resolve(10);
  return a + b;
};



// сбор статистики
let restApi = new RestRequest('https://min-api.cryptocompare.com/data');
let histodayPromise = restApi.get('histoday', {
  fsym: 'BTC',
  tsym: 'USD',
  limit: 2000
});

// var allCoinlistPromise = restApi.get('all/coinlist');

// сохранение в базу данных
const url = 'mongodb://readWrite:readWrite@localhost:27017/crypto';
let clientPromise = MongoClient.connect(url, {useNewUrlParser: true});

Promise.all([histodayPromise, clientPromise]).then(values => {
  let histoday = values[0];
  let client = values[1];

  console.log(new Date(histoday.Data[0].time * 1000));
  console.log(new Date(histoday.Data[2000].time * 1000));

  let data = histoday.Data.map(e => {
    e.date = new Date(e.time * 1000);
    e.fsym = 'BTC';
    e.tsym = 'USD';
    return e;
  });

  let prev = 0;
  let post = 1;
  let to = data.length - post;

  for (let i = prev; i < to; i++) {
    let next = data[i + 1];
    let current = data[i];

    //var sign = current.close >= current.open; // направление
    let max = current.close > current.open ? current.close : current.open; // верхняя граница свечи
    let min = current.close < current.open ? current.close : current.open; // нижняя граница свечи
    let sign = (current.close - current.open) / current.high;
    let total = current.high - current.low; // полный размер
    let body = (max - min) / total; // доля тела
    let top = (sign >= 0 ? (current.high - max) : (min - current.low)) / total; // доля верхнего фитиля
    let bottom = (sign < 0 ? (current.high - max) : (min - current.low)) / total; // доля нижнего фитиля

    data[i].input = {
      sign: sign,
      top: top,
      body: body,
      bottom: bottom
    };

    let good = next.high > current.high ? 1 : 0;
    let bad = next.low < current.low ? -1 : 0;

    data[i].output = {
      good: good,
      bad: bad
    };

    /*if (i < 1900) net.train([{input: [sign, top, bottom], output: [good]}]);
    else {
      var output = net.run([sign, top, bottom]);
      console.log('test good: ', good, ' - ', output[0]);//, ', bad: ', bad, ' - ', output[1]);
    }*/

    /*if (i < 1900) {
      myNetwork.activate([sign, top, bottom]);
	    myNetwork.propagate(learningRate, [good]);
    }
    else {
      var output = myNetwork.activate([sign, top, bottom]);
      console.log('test good: ', good, ' - ', output[0]);
    }*/


    // next > current: 100% позитивный
    // next < current: 100% негативный
    // next поглощает current и наоборот: 100% неопределенность
    // остальные частично

    // риск негативного исхода
    // next.high < current.low = -1
    // next.low >= current.high = 0
    // total = current.high - next.low;
    // bad = current.high - next.high + current.low - next.low;

    // вероятность позитивного исхода
    // next.high < current.low = 0
    // next.low > current.high = 1
    // total = next.high - current.low;
    // good = next.high - current.high + current.low - next.low;
  }

  //console.log(net.toJSON());

  let db = client.db('crypto');
  let collection = db.collection('histoday');

  collection.drop().then(() =>
    collection.insertMany(data).then(() => client.close())
  );
});
