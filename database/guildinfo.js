const mongo = require ('mongoose');

const guildInfo = mongo.Schema({
    guildID: String,
    memberCount: Array
});

module.exports = mongo.model('guildinfo', guildInfo);