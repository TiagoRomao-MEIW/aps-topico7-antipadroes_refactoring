/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

const checkDiscordAPI = require('./DiscordAPI');
const {connect, mongoDbName} = require('../Models/database');
let mongoCli;

// comunica com a API do Discord e extrai as mensagens do canal do Discord configurado da atividade do utilizado do aluno identificado na atividade
async function createAnalytics(activityID, InveniRAstdID, DiscordUsername, DiscordChID, req, res) {
  mongoCli = await connect();
  if (!mongoCli) {
    console.log('Cliente MongoDB não definido');
    return;
  }
  const analyticsCollection = mongoCli.db(mongoDbName).collection('analytics');
  const activity = {
    activityID: activityID,
    InveniRAstdID: InveniRAstdID,
  };
  analyticsCollection.updateOne(
      activity,
      {$set: activity},
      {upsert: true}, async (err, result) => {
        if (err) {
          console.error(err);
          res.sendStatus(500);
          return;
        }
        await checkDiscordAPI(activity, DiscordUsername, DiscordChID, res);
      },
  );
}

module.exports = createAnalytics;

