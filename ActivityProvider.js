/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

require('dotenv/config');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const api = require('./src/Views/API');

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(api);


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
