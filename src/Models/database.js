/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

const MongoClient = require('mongodb').MongoClient;
const mongoUrl = process.env.DB_CONN;
const mongoDbName = process.env.DB_NAME;

// ligação a base de dados MongoDB
async function connect() {
  try {
    return await MongoClient.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
  } catch (err) {
    console.error(err);
    return;
  }
}

module.exports = {connect, mongoDbName};
