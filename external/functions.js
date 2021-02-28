const userInfoDB = require ('../database/userinfo');

function randomColor (color) {
	return parseInt (config.discordInfo.embedColors[color] [Math.floor(Math.random() * config.discordInfo.embedColors[color].length)], 16);
}

async function getUserInfo (member, guild) {
    if (!member || !guild || !member.id || !guild.id) return errorLog (message, args, 'General', 'general')
    let userInfo = await userInfoDB.findOne ({
        userID: member.id,
        guildID: guild.id
    })
    if (!userInfo) {
        const newUserInfo = new userInfoDB({
            userID: member.id,
            guildID: guild.id,
            experience: 10,
            money: 50
        });
        newUserInfo.save();
        userInfo = newUserInfo
    }
    return userInfo;
}

function timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function currencyFormat (number) {
    format = '$' + number.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return format;
}

module.exports = {randomColor, getUserInfo, timeout, currencyFormat}