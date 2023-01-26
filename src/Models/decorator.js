/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

// padrão de estrutura Decorator
function ActivityDecorator(activity, updateCount=0) {
  this.activity = activity;
  this.updateCount = updateCount;
}

ActivityDecorator.prototype.update = function() {
  this.updateCount++;
  this.activity.update();
};

ActivityDecorator.prototype.getUpdatesCount = function() {
  return this.updateCount;
};

module.exports = ActivityDecorator;

