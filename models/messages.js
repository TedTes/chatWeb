const moment = require('moment');

function formatMessage(name, text,groupName) {
  return {
    name,
    text,
    time: moment().format('dddd, MMMM Do YYYY, h:mm a'),
    groupName
  };
}

module.exports = formatMessage;
