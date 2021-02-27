const mongo = require ('mongoose');

const workInfo = mongo.Schema({
    guildID: String,
    ticker: String,
    name: String,
    private: Boolean,
    work: String,
    frequency: Number,
    cooldown: Number
});

module.exports = mongo.model('workinfo', workInfo);