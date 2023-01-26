/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

const Joi = require('@hapi/joi');

const activitySchema = Joi.object().keys({
  activityID: Joi.number().required(),
});

const configSchema = Joi.object().keys({
  DiscordChID: Joi.string().required(),
  SlackChID: Joi.string().required(),
});

const deployActivity = Joi.object().keys({
  activityID: Joi.number().required(),
  InveniRAstdID: Joi.number().required(),
  DiscordChID: Joi.string().required(),
  SlackChID: Joi.string().required(),
});

const UsrActivityParams = Joi.object().keys({
  activityID: Joi.number().required(),
  InveniRAstdID: Joi.number().required(),
});

const StdActivity = Joi.object().keys({
  activityID: Joi.number().required(),
  DiscordUsername: Joi.string().required(),
  SlackUsername: Joi.string().required(),
  DiscordChID: Joi.string().required(),
  SlackChID: Joi.string().required(),
});

module.exports = {
  configSchema,
  activitySchema,
  deployActivity,
  UsrActivityParams,
  StdActivity,
};
