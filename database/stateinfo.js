const mongo = require ('mongoose');

const stateInfo = mongo.Schema({
    guildID: String,
    postalCode: String,
    votingProcess: String,
    candidates: Array,
    governorID: String,
    welcomeMessage: String
});

module.exports = mongo.model('stateinfo', stateInfo);