/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

const {connect, mongoDbName} = require('../Models/database');
let mongoCli;

const Activity = require('../Models/prototype');
const ActivityDecorator = require('../Models/decorator');
const {ActivitySubject, ActivityObserver} = require('../Models/observer');

// cria uma instância do ActivitySubject
const activitySubject = new ActivitySubject();

// Observadores
const observer = new ActivityObserver();
activitySubject.addObserver(observer);

// implementação dos padrões de criação Prototype, de estrutura Decorator e de comportamento Observer
async function generateActivityId(DiscordChID, SlackChID) {
  const activity = new ActivityDecorator(new Activity(DiscordChID, SlackChID));
  mongoCli = await connect();
  if (!mongoCli) {
    console.log('Cliente MongoDB não definido');
    return;
  }
  const activitiesCollection = mongoCli.db(mongoDbName).collection('activities');

  // verifica se existe uma atividade com os mesmos parametros
  let result = await activitiesCollection.findOne({jsonParams: {DiscordChID: activity.activity.DiscordChID, SlackChID: activity.activity.SlackChID}});
  if (result) {
    // incrementar o contador de atualizações
    activity.updateCount = result.updateCount + 1;
    // atualizar o documento
    activitiesCollection.updateOne(
        {activityID: result.activityID},
        {$set: {jsonParams: {DiscordChID: activity.activity.DiscordChID, SlackChID: activity.activity.SlackChID}, activityID: result.activityID, updateCount: activity.updateCount}},
    );
    activitySubject.notifyObservers('update', result.activityID); // Notificar os Observadores que uma atividade foi criado
    return result.activityID;
  } else {
    // verifica qual o último activityID e cria um novo valor
    result = await activitiesCollection.find({}, {activityID: 1}).sort({activityID: -1}).limit(1).toArray();
    let maxActivityId = 999;
    if (result.length > 0) {
      maxActivityId = Number(result[0].activityID);
    }
    const newId = maxActivityId + 1;
    activity.updateCount = 0;
    await activitiesCollection.insertOne({activityID: newId, jsonParams: {DiscordChID: activity.activity.DiscordChID, SlackChID: activity.activity.SlackChID}, updateCount: 0});
    activitySubject.notifyObservers('create', newId); // Notificar os Observadores que uma atividade foi criado
    return newId;
  };
}

module.exports = generateActivityId;
