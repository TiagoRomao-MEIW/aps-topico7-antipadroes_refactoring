/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

// padrão de criação Prototype
function Activity(DiscordChID, SlackChID) {
  this.DiscordChID = DiscordChID;
  this.SlackChID = SlackChID;
}

Activity.prototype.getJsonParams = function() {
  return {
    DiscordChID: this.DiscordChID,
    SlackChID: this.SlackChID,
  };
};

module.exports = Activity;
