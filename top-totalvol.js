const MongoClient = require('mongodb');
const rp = require('request-promise');

module.exports = async () => {
  const dbUri = process.env.DB_URI;
  const dbName = process.env.DB_NAME;
  const collectionName = 'top-totalvol';

  const tsym = 'USD';
  const limit = 2000;
  const apiBaseUrl = 'https://min-api.cryptocompare.com/data/';
  const apiUrl = 'top/totalvol';

  const mongoPromise = MongoClient.connect(dbUri, {
    useNewUrlParser: true,
  });

  // не забыть очистить от старых значений

  const options = {
    baseUrl: apiBaseUrl,
    url: apiUrl,
    qs: {
      tsym,
      limit,
    },
  };

  const apiPromise = rp(options);

  Promise.all([mongoPromise, apiPromise]).then((values) => {
    const mongo = values[0];
    const body = JSON.parse(values[1]);
    const data = body.Data;

    const document = {
      tsym,
      Data: data,
    };

    const db = mongo.db(dbName);
    const collection = db.collection(collectionName);

    collection.insertOne(document).then(() => mongo.close());
  });
};
