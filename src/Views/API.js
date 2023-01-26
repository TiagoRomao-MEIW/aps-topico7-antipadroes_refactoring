/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

require('dotenv/config');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const app = express();
const mongoUrl = process.env.DB_CONN;
const mongoDbName = process.env.DB_NAME;
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const path = require('path');
const apiPath = path.resolve(__dirname, 'API.js');
const fs = require('fs');
const generateActivityId = require('../Controllers/generateActivityId');
const Activity = require('../Models/prototype');
const createAnalytics = require('../Controllers/createAnalytics');
const {configSchema, activitySchema, deployActivity, UsrActivityParams, StdActivity} = require('../Models/validationSchemas');


const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      description: 'Tiago Romão | UTAD 75309',
      title: 'Activity Provider API',
      version: '1.0.0',
    },
  },
  apis: [apiPath],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

let mongoClient;

// ligação a base de dados MongoDB
MongoClient.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
  if (err) {
    console.error(err);
    return;
  }
  mongoClient = client;
});


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));


/**
 * @swagger
 * paths:
 *  /config_url:
 *    get:
 *      summary: Recebe HTML de configuração da atividade
 *      tags: [1. Activity Configuration]
 *      responses:
 *        '200':
 *          description: Recebe HTML de configuração da atividade
 *          content:
 *            text/html:
 *              schema:
 *                type: string
 *                example:
 *                  <form method="POST" action="/config_url">
 *                    <label for="DiscordChID">ID Canal Discord:</label><br>
 *                    <input type="text" id="DiscordChID" name="DiscordChID"><br>
 *                    <label for="SlackChID">ID Grupo de Slack:</label><br>
 *                    <input type="text" id="SlackChID" name="SlackChID"><br>
 *                    <input type="submit" value="Submeter">
 *                  </form>
 */

// webservice para configurar uma atividade
app.get('/config_url', (req, res) => {
  res.send(`
    <form method="POST" action="/config_url">
      <label for="DiscordChID">ID Canal Discord:</label><br>
      <input type="number" id="DiscordChID" name="DiscordChID"><br>
      <label for="SlackChID">ID Grupo de Slack:</label><br>
      <input type="text" id="SlackChID" name="SlackChID"><br>
      <input type="submit" value="Submeter">
    </form>
  `);
});

app.post('/config_url', (req, res) => {
  const {error} = configSchema.validate(req.body);
  if (error) {
    res.status(400).send(error.message);
    return;
  }
  const DiscordChID = req.body.DiscordChID;
  const SlackChID = req.body.SlackChID;
  generateActivityId(DiscordChID, SlackChID).then((activityID) => {
    const activity = Object.create(Activity.prototype);
    activity.DiscordChID = DiscordChID;
    activity.SlackChID = SlackChID;
    activity.activityID = activityID;
    const activitiesCollection = mongoClient.db(mongoDbName).collection('activities');
    activitiesCollection.updateOne(
        {activityID: activityID},
        {$set: {jsonParams: activity.getJsonParams(), activityID: activityID}},
        {upsert: true},
        (err, result) => {
          if (err) {
            console.error(err);
            res.sendStatus(500);
            return;
          }
          res.send(`O <b>activityID<b/> da atividade configurada é: ${activityID}`);
        },
    );
  }).catch((error) => {
    console.log(error);
  });
});


/**
 * @swagger
 * paths:
 *  /json_params_url/{activityID}:
 *    get:
 *      summary: Recebe JSON com lista de parametros da atividade
 *      tags: [2. Activity Parameters]
 *      parameters:
 *      - in: path
 *        name: activityID
 *        schema:
 *          type: integer
 *        required: true
 *        description: ID da atividade
 *      responses:
 *        '200':
 *          description: Recebe JSON com lista de parametros da atividade
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 */

// webservice que devolve lista dos parametros configurados de uma atividade em formato JSON
app.get('/json_params_url/:activityID', (req, res) => {
  const {error} = activitySchema.validate(req.params);
  if (error) {
    res.status(400).send(error.message);
    return;
  }
  const activityID = Number(req.params.activityID);
  const activitiesCollection = mongoClient.db(mongoDbName).collection('activities');
  activitiesCollection.findOne({activityID: activityID}, {projection: {_id: 0, updateCount: 0}}, (err, result) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
      return;
    }
    if (!result) {
      res.sendStatus(404);
      return;
    }
    res.send(result);
  });
});


/**
 * @swagger
 * paths:
 *  /analytics_list_url:
 *    get:
 *      summary: Recebe JSON com lista das analíticas a serem recolhidas da atividade
 *      tags: [3. List of Analytics]
 *      responses:
 *        '200':
 *          description: Recebe JSON com lista de parametros da atividade
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 */

// webservice que devolve lista de analíticas a serem recolhidas em formato JSON
app.get('/analytics_list_url', (req, res) => {
  fs.readFile('analytics_list.json', (err, data) =>{
    if (err) throw err;
    const analytics = JSON.parse(data);
    res.send(analytics);
  });
});


/**
 * @swagger
 * paths:
 *  /user_url/{activityID}:
 *    get:
 *      summary: Devolve URL com a atividade indicada no parametro
 *      tags: [4. Deploy Activity]
 *      parameters:
 *      - in: path
 *        name: activityID
 *        schema:
 *          type: integer
 *        required: true
 *        description: ID da atividade
 *      responses:
 *        '200':
 *          description: Devolve URL com a atividade indicada no parametro
 *          content:
 *            text/html:
 *              schema:
 *                type: string
 *                example:
 *                  <form method="POST" action="/user_url">
 *                      <input type="hidden" name="activityID" value="${activityID}">
 *                      <label for="InveniRAstdID">Insira o n.º de aluno:</label><br>
 *                      <input type="text" id="InveniRAstdID" name="InveniRAstdID"><br>
 *                      <input type="hidden" name="DiscordChID" value="${doc.jsonParams.DiscordChID}">
 *                      <input type="hidden" name="SlackChID" value="${doc.jsonParams.SlackChID}">
 *                      <input type="submit" value="Submit">
 *                  </form>
 */

// webservice para efetuar o deploy de uma atividade
app.get('/user_url/:activityID', (req, res) => {
  const {error} = activitySchema.validate(req.params);
  if (error) {
    res.status(400).send(error.message);
    return;
  }
  const activityID = Number(req.params.activityID);
  const activitiesCollection = mongoClient.db(mongoDbName).collection('activities');
  activitiesCollection.findOne({activityID: activityID}, (err, doc) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
      return;
    }

    res.send(`
        <form method="POST" action="/user_url">
          <input type="hidden" name="activityID" value="${activityID}">
          <label for="InveniRAstdID">Insira o n.º de aluno:</label><br>
          <input type="text" id="InveniRAstdID" name="InveniRAstdID"><br>
          <input type="hidden" name="DiscordChID" value="${doc.jsonParams.DiscordChID}">
          <input type="hidden" name="SlackChID" value="${doc.jsonParams.SlackChID}">
          <input type="submit" value="Submit">
        </form>
      `);
  });
});


/**
 * @swagger
 * paths:
 *  /user_url:
 *    post:
 *      summary: Devolve URL da atividade seguido do ID da instancia da atividade (activityID), o id do aluno (InveniRAstdID) e os parametros da atividade
 *      tags: [4. Deploy Activity]
 *      requestBody:
 *        required: true
 *        content:
 *            application/json:
 *                schema:
 *                  type: object
 *                  properties:
 *                      activityID:
 *                          type: integer
 *                      InveniRAstdID:
 *                          type: integer
 *                      DiscordUsername:
 *                          type: integer
 *                      SlackUsername:
 *                          type: integer
 *                      json_params:
 *                          type: object
 *                          properties:
 *                                  DiscordChID:
 *                                      type: integer
 *                                  SlackChID:
 *                                      type: string
 *      responses:
 *        '200':
 *          description: Devolve URL da atividade seguido do ID da instancia da atividade (activityID)
 *          content:
 *            text/html:
 *              schema:
 *                type: string
 *                example:
 *                    <form method="POST" action="/deploy_activity/${activityID}/${InveniRAstdID}">
 *                        <input type="hidden" name="activityID" value="${activityID}">
 *                        <label for="SlackUsername">Insira o seu utilizador de Slack:</label><br>
 *                        <input type="text" id="SlackUsername" name="SlackUsername"><br>
 *                        <label for="DiscordUsername">Insira o seu utilizador de Discord:</label><br>
 *                        <input type="text" id="DiscordUsername" name="DiscordUsername"><br>
 *                        <input type="hidden" name="DiscordChID" value="${jsonParams.DiscordChID}">
 *                        <input type="hidden" name="SlackChID" value="${jsonParams.SlackChID}">
 *                        <input type="submit" value="Submit">
 *                    </form>
 */

// webservice de uma instancia da atividade realizada pelo aluno
app.post('/user_url', (req, res) => {
  const {error} = deployActivity.validate(req.body);
  if (error) {
    res.status(400).send(error.message);
    return;
  }
  const activityID = req.body.activityID;
  const InveniRAstdID = req.body.InveniRAstdID;
  const jsonParams = {
    DiscordChID: req.body.DiscordChID,
    SlackChID: req.body.SlackChID,
  };
  res.send(`
  <form method="POST" action="/deploy_activity/${activityID}/${InveniRAstdID}">
    <input type="hidden" name="activityID" value="${activityID}">
    <label for="SlackUsername">Insira o seu utilizador de Slack:</label><br>
    <input type="text" id="SlackUsername" name="SlackUsername"><br>
    <label for="DiscordUsername">Insira o seu utilizador de Discord:</label><br>
    <input type="text" id="DiscordUsername" name="DiscordUsername"><br>
    <input type="hidden" name="DiscordChID" value="${jsonParams.DiscordChID}">
    <input type="hidden" name="SlackChID" value="${jsonParams.SlackChID}">
    <input type="submit" value="Submit">
  </form>
`);
});

app.post('/deploy_activity/:activityID/:InveniRAstdID', (req, res) => {
  const {error1} = UsrActivityParams.validate(req.params);
  if (error1) {
    res.status(400).send(error.message);
    return;
  }
  const {error2} = StdActivity.validate(req.body);
  if (error2) {
    res.status(400).send(error.message);
    return;
  }
  const activityID = req.params.activityID;
  const InveniRAstdID = req.params.InveniRAstdID;
  const DiscordUsername = req.body.DiscordUsername;
  const DiscordChID = req.body.DiscordChID;
  const jsonParams = {
    DiscordChID: req.body.DiscordChID,
    SlackChID: req.body.SlackChID,
  };
  const userActivity = {
    activityID: activityID,
    InveniRAstdID: InveniRAstdID,
    jsonParams: jsonParams,
    SlackUsername: req.body.SlackUsername,
    DiscordUsername: req.body.DiscordUsername,
  };

  const user_activityCollection = mongoClient.db(mongoDbName).collection('user_activity');

  user_activityCollection.findOneAndUpdate(
      {activityID: activityID, InveniRAstdID: InveniRAstdID},
      {$set: userActivity},
      {upsert: true, returnOriginal: false},
      (err, result) => {
        if (err) {
          console.error(err);
          console.log('ERRO!!!');
          return;
        }
        console.log('Instância da atividade do aluno criada ou atualizada!');
      },
  );

  createAnalytics(activityID, InveniRAstdID, DiscordUsername, DiscordChID, req, res);
});

/**
 * @swagger
 * paths:
 *  /analytics_url:
 *    post:
 *      summary: Devolve as analiticas de todos os alunos, recolhidas para a atividade identificada (activityID)
 *      tags: [5. Show All Activity Analytics]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                        activityID:
 *                            type: string
 *                      example:
 *                        {
 *                            "activityID": 1
 *                        }
 *      responses:
 *        '200':
 *          description: Devolve todas as analíticas recolhidas para a atividade
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  activityID:
 *                    type: integer
 *                  analytics:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        InveniRAstdID:
 *                            type: string
 *                        quantAnalytics:
 *                            type: object
 *                            properties:
 *                                MsgDiscord:
 *                                    type: boolean
 *                                NumDiscord:
 *                                    type: integer
 *                                MsgSlack:
 *                                    type: boolean
 *                                NumSlack:
 *                                    type: integer
 *                        qualAnalytics:
 *                            type: object
 *                            properties:
 *                                DtUltMsgDiscord:
 *                                    type: string
 *                                DtUltMsgSlack:
 *                                    type: string
 */

// webservice que devolve a lista de analíticas recolhidas de uma determinada atividade (no corpo do pedido POST)
app.post('/analytics_url', (req, res) => {
  const {error} = activitySchema.validate(req.body);
  if (error) {
    res.status(400).send(error.message);
    return;
  }
  const actID = req.body.activityID;
  const analyticsCollection = mongoClient.db(mongoDbName).collection('analytics');
  analyticsCollection.find({activityID: actID}).toArray((err, docs) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
      return;
    }
    res.send(`
      <h1>Analytics</h1>
      <table>
        <tr>
          <th>Atividade</th>
          <th>Aluno</th>
          <th>Discord?</th>
          <th>N.º Msg Discord</th>
          <th>Data Ultima Mensagem Discord</th>
          <th>Slack?</th>
          <th>N.º Msg Slack</th>
          <th>Data Ultima Mensagem Slack</th>
        </tr>
        ${docs.map((doc) =>
    ` <tr>
            <td>${doc.activityID}</td>
            <td>${doc.InveniRAstdID}</td>
            <td>${doc.quantAnalytics.MsgDiscord}</td>
            <td>${doc.quantAnalytics.NumDiscord}</td>
            <td>${doc.qualAnalytics.DtUltMsgDiscord}</td>
            <td>${doc.quantAnalytics.MsgSlack}</td>
            <td>${doc.quantAnalytics.NumSlack}</td>
            <td>${doc.qualAnalytics.DtUltMsgSlack}</td>
          </tr>
        `).join('')}
      </table>
    `);
  });
});

module.exports = app;
