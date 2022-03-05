const { MongoClient } = require('mongodb');
const express = require('express')
const md5 = require('md5');
const bunyan = require('bunyan');

const log = bunyan.createLogger({name: "url-shortener"});

const config = {
    MONGO_URL: process.env.MONGO_URL || 'mongodb://mongo:27017'
}

const client = new MongoClient(config.MONGO_URL);
const app = express()
app.use(express.json())

// TODO: Set index
// - origin_1
// - hash_1

app.get('/', function (req, res) {
  res.send('Hello World')
})

// Create short url
app.post('/url', async (req, res) => {
    // TODO: Validata incomming url
    log.info(`body: ${req.body}`)
    let origin = req.body.url
    let hash = md5(origin)
    // TODO: Re-impliment hash function incoude time data.

    await client.connect();
    const database = client.db("app");
    const url = database.collection("url");

    const result = await url.updateOne(
        { origin: origin }, 
        {
            $set: {
                origin: origin,
                hash: hash,
            }
        }, 
        { upsert: true },
    );
    log.debug(
      `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
    );

    res.status(201).json({
        origin: origin,
        sha: md5(origin),
    })

  })

// Get url by hash
app.get('/url/:hash', async (req, res) => {

    let hash = req.params.hash

    await client.connect();
    const database = client.db("app");
    const url = database.collection("url");

    const result = await url.findOne(
        { hash: hash }, 
        {
            projection: { _id: 0, origin: 1 },
        }
    );
    log.debug(result);

    if (!result) {
        res.status(404)
    } 

    res.set({
        'Cache-Control': 'publuc; max-age: 3600',
    }).redirect(result.origin)

})

app.listen(3000)
log.info("server started");



