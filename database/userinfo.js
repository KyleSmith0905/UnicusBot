const mongo = require ('mongoose');

const userInfo = mongo.Schema({
    userID: String,
    guildID: String,
    roleID: Array,
    money: Number,
    state: String,
    experience: Number,
    occupation: {
        ticker: String,
        name: String,
        unused: Number,
        refresh: Date
    },
    moderation: {
        warnType: Array,
        muted: Boolean,
        priorRoles: Array,
        timestampEnd: Date
    },
    arrival: {
        from: String,
        timestamp: Number,
        cost: Number
    },
    items: Array,
    timing: Array
});

module.exports = mongo.model('userinfo', userInfo)