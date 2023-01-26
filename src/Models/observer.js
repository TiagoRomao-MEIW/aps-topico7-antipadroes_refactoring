/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

// padrão de comportamento Observer
function ActivitySubject() {
  this.observers = [];
}

ActivitySubject.prototype.addObserver = function(observer) {
  this.observers.push(observer);
};

ActivitySubject.prototype.removeObserver = function(observer) {
  const index = this.observers.indexOf(observer);
  if (index !== -1) {
    this.observers.splice(index, 1);
  }
};

ActivitySubject.prototype.notifyObservers = function(param, newId) {
  this.observers.forEach((observer) => {
    observer.param = param;
    observer.newId = newId;
    observer.update(param, newId);
  });
};

function ActivityObserver(param, newId) {
  this.update = function(param, newId) {
    if (this.param === 'create') {
      console.log(`Uma nova atividade foi criada com o ID: ${newId}.`);
    } else if (this.param === 'update') {
      console.log(`A atividade com o ID: ${newId} foi atualizada.`);
    } else {
      console.log('Erro!');
    }
  };
};

module.exports = {ActivitySubject, ActivityObserver};
