const mongo = require ('mongoose');

const companyInfo = mongo.Schema({
    guildID: String,
    ticker: String,
    name: String,
    executiveID: String,
    jobs: []
});

module.exports = mongo.model('companyinfo', companyInfo);