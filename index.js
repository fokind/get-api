const MongoClient = require('mongodb');
// const RestRequest = require('rest-request');
const async = require('async');
const rp = require('request-promise');

// import { NeuralNetwork } from 'brain.js';

// import { Layer, Network } from 'synaptic';

/* const inputLayer = new Layer(3);
const hiddenLayer = new Layer(5);
const outputLayer = new Layer(1); */

/* inputLayer.project(hiddenLayer);
hiddenLayer.project(outputLayer); */

/* const myNetwork = new Network({
  input: inputLayer,
  hidden: [hiddenLayer],
  output: outputLayer,
}); */

// const learningRate = 0.3;

/* const config = {
}; */
// create a simple recurrent neural network
// var net = new brain.recurrent.LSTM(config);
// const net = new NeuralNetwork(config);

/* const load = async () => {
  const a = await Promise.resolve(5);
  const b = await Promise.resolve(10);
  return a + b;
}; */

// сбор статистики
/* const restApi = new RestRequest('https://min-api.cryptocompare.com/data');
const histodayPromise = restApi.get('histoday', {
  fsym: 'BTC',
  tsym: 'USD',
  limit: 2000,
}); */

const fsym = 'BTC';
const tsym = 'USD';
const limit = 1;

const request = require('request');

/* request(`https://min-api.cryptocompare.com/data/histoday?fsym=${fsym}&tsym=${tsym}&limit=${limit}`, (error, response, body) => {
  // console.log('error:', error);
  // console.log('statusCode:', response && response.statusCode);
  let jBody = JSON.parse(body);
  console.log('body:', jBody.Data);
  //console.log('Data:', body.Data);
  console.log('Data:', typeof jBody.Data);
}); */

/* const load = async () => {
  const a = await Promise.resolve(5);
  const b = await Promise.resolve(10);
  return a + b;
};

load().then(value => console.log(value)); // 15 */


const dbPromise = MongoClient.connect('mongodb://readWrite:readWrite@localhost:27017/crypto', { useNewUrlParser: true });

let count = 0;
let toTs;

const loadAll = async.whilst(
  () => {
    console.log(count);
    return count <= 1;
  },
  (callback) => {
    count += 1;
    const apiPromise = rp(`https://min-api.cryptocompare.com/data/histoday?fsym=${fsym}&tsym=${tsym}&limit=${limit}${toTs ? `&toTs=${toTs}` : ''}`);
    Promise.all([dbPromise, apiPromise]).then((values) => {
      console.log(values);
      /* const db = values[0];
      const response = values[1];
      const jBody = JSON.parse(response);
      toTs = jBody.TimeFrom;
      console.log(toTs); */
      callback(null, count);
    });
  },
  () => {
    // console.log(n);
  },
);

/* Promise.all([dbPromise, apiPromise]).then((values) => {
  let mongo = values[0];

  console.log(values);
}); */

// будем последовательно
// заполнить базу данных исходными данными, весь временной ряд по заданной валюте полностью
// не дожидаемся подключения к монго
// выполняем последовательно запросы к апи до тех пор, пока количество извлеченных данных не станет меньше лимита
// после каждого полученного результата отправляем его в монго
// для этого синхронизируем два промиса подключение к монго и получение результатов


// console.log('1');

/* let count = 0;
whilst(
  () => count < 5,
  (callback) => {
    count += 1;
    setTimeout(() => {
      callback(null, count);
    }, 1000);
  },
  () => {},
); */

// var allCoinlistPromise = restApi.get('all/coinlist');

// сохранение в базу данных
/* const url = "mongodb://readWrite:readWrite@localhost:27017/crypto";
const clientPromise = MongoClient.connect(
  url,
  {
    useNewUrlParser: true
  }
); */

/* Promise.all([histodayPromise, clientPromise]).then((values) => {
  const histoday = values[0];
  const client = values[1];

  // console.log(new Date(histoday.Data[0].time * 1000));
  // console.log(new Date(histoday.Data[2000].time * 1000));
  console.log(histoday);

  const data = histoday.Data.map((e) => {
    e.date = new Date(e.time * 1000);
    e.fsym = 'BTC';
    e.tsym = 'USD';
    return e;
  });

  const prev = 0;
  const post = 1;
  const to = data.length - post;

  for (let i = prev; i < to; i++) {
    const next = data[i + 1];
    const current = data[i];

    // var sign = current.close >= current.open; // направление
    const max = current.close > current.open ? current.close : current.open; // верхняя граница свечи
    const min = current.close < current.open ? current.close : current.open; // нижняя граница свечи
    const sign = (current.close - current.open) / current.high;
    const total = current.high - current.low; // полный размер
    const body = (max - min) / total; // доля тела
    const top = (sign >= 0 ? (current.high - max) : (min - current.low)) / total; // доля верхнего фитиля
    const bottom = (sign < 0 ? (current.high - max) : (min - current.low)) / total; // доля нижнего фитиля

    data[i].input = {
      sign,
      top,
      body,
      bottom,
    };

    const good = next.high > current.high ? 1 : 0;
    const bad = next.low < current.low ? -1 : 0;

    data[i].output = {
      good,
      bad,
    };

    /* if (i < 1900) net.train([{input: [sign, top, bottom], output: [good]}]);
    else {
      var output = net.run([sign, top, bottom]);
      console.log('test good: ', good, ' - ', output[0]);//, ', bad: ', bad, ' - ', output[1]);
    } */

/* if (i < 1900) {
  myNetwork.activate([sign, top, bottom]);
  myNetwork.propagate(learningRate, [good]);
}
else {
  var output = myNetwork.activate([sign, top, bottom]);
  console.log('test good: ', good, ' - ', output[0]);
} */

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
// }

// console.log(net.toJSON());

/* const db = client.db('crypto');
  const collection = db.collection('histoday');

  collection.drop().then(() => collection.insertMany(data).then(() => client.close()));
}); */
