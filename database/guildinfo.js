const mongo = require ('mongoose');

const guildInfo = mongo.Schema({
    guildID: String,
    memberCount: Array,
    statisticOpen: Boolean
});

module.exports = mongo.model('guildinfo', guildInfo);