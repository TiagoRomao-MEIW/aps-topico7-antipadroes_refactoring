/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

const Discord = require('discord.js');
const {connect, mongoDbName} = require('../Models/database');
let mongoCli;

// Conexão à API do Discord e extrai as mensagens do aluno no canal configurado em jsonParams
async function checkDiscordAPI(activity, DiscordUsername, DiscordChID, res) {
  mongoCli = await connect();
  if (!mongoCli) {
    console.log('Cliente MongoDB não definido');
    return;
  }
  const analyticsCollection = mongoCli.db(mongoDbName).collection('analytics');
  const discordClient = new Discord.Client({intents: 32767});
  discordClient.login(process.env.DISCORD_TOKEN);
  discordClient.on('ready', () => {
    const channel = discordClient.channels.cache.get(DiscordChID);
    if (!channel) {
      analyticsCollection.updateOne(
          activity,
          {
            $set: {
              quantAnalytics: {
                MsgDiscord: false,
                NumDiscord: 0,
                MsgSlack: false,
                NumSlack: 0,
              },
              qualAnalytics: {
                DtUltMsgDiscord: null,
                DtUltMsgSlack: null,
              },
            },
          });
      res.send(`Não foi possível encontrar o canal de Discord com o ID: <b>${DiscordChID}</b>`);
      return;
    }
    channel.messages.fetch({limit: 100}).then((messages) => {
      const filteredMessages = messages.filter((message) => message.author.username === DiscordUsername);
      const MsgDiscord = filteredMessages.size > 0;
      const NumDiscord = filteredMessages.size;
      let DtUltMsgDiscord = null;
      if (NumDiscord > 0) {
        TempDate = filteredMessages.sort((a, b) => b.createdTimestamp - a.createdTimestamp).first().createdTimestamp;
        date = new Date(TempDate);
        DtUltMsgDiscord = date.toLocaleDateString('en-GB');
      }
      analyticsCollection.updateOne(
          activity,
          {
            $set: {
              quantAnalytics: {
                MsgDiscord: MsgDiscord,
                NumDiscord: NumDiscord,
                MsgSlack: false,
                NumSlack: 0,
              },
              qualAnalytics: {
                DtUltMsgDiscord: DtUltMsgDiscord,
                DtUltMsgSlack: null,
              },
            },
          },
          (err, result) => {
            if (err) {
              console.error(err);
              res.sendStatus(500);
              return;
            }
            res.send('Atividade realizada com sucesso!');
          },
      );
      activityAnalytics = {
        activityID: activity.activityID,
        InveniRAstdID: activity.InveniRAstdID,
        quantAnalytics: {
          MsgDiscord: MsgDiscord,
          NumDiscord: NumDiscord,
          MsgSlack: false,
          NumSlack: 0,
        },
        qualAnalytics: {
          DtUltMsgDiscord: DtUltMsgDiscord,
          DtUltMsgSlack: '',
        },
      };
      return activityAnalytics;
    }).catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
  });
};

module.exports =checkDiscordAPI;
