const purchaseConfig = config.commands.purchase;
const {randomColor, getUserInfo, currencyFormat} = require ('./functions');
const userInfoDB = require ('../database/userinfo');

module.exports = {
    name: 'purchase',
    summoner: purchaseConfig.alias,
    cooldown: 2,
    async execute (message, args) {
        let guild = message.channel.guild;
        let member = message.member;
        let userInfo = await getUserInfo (member, guild);
        let itemKey = Object.keys(purchaseConfig.arguments.item.inputs).find (ele => purchaseConfig.arguments.item.inputs[ele].alias.includes (args[1]));
        if (!itemKey) return errorLog (message, args, 'purchase', 'invalidUsage', ['item']);
        const itemProperties = purchaseConfig.arguments.item.inputs[itemKey];
        let index = message.content.toLowerCase().indexOf(args[2]);
        let settings = message.content.substring(0, message.content.length - 1).slice(index).replace (/\[n]/g, '\n');
        let settingsSplit = settings.split ('`| ');
        let price = getPrice (settingsSplit, itemProperties, userInfo);
        if (!userInfo.money || userInfo.money < price) return errorLog (message, args, 'purchase', 'money', [itemProperties.name + ' cost', price, userInfo.money]);
        let options = (args[2]) ? confirmOptions (settingsSplit, itemProperties) : [];
        if (!options || options == null || price == 'error') return errorLog (message, args, 'purchase', 'invalidUsage', [itemKey + 'Settings']);
        let embed = {
            title: 'Purchase - ' + itemProperties.name,
            description: itemProperties.description,
            timestamp: new Date().toISOString(),
            color: randomColor ('white'),
            fields: [
                {name: 'Shopper', value: member.mention, inline: true},
                {name: 'Price', value: currencyFormat (price), inline: true},
                {name: 'Confirmation', value: 'Please verify the payment', inline: true}
            ]
        }
        embed.fields = embed.fields.concat (options)
        let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed})
        sentMessage.addReaction ('👍');
        sentMessage.addReaction ('👎');
        let filter = (mes, emj, usr) => (emj.name == '👍' || emj.name == '👎') && usr == member.id;
        let collector = new reactionCollector (client, sentMessage, filter, {time: 3600000});
        collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
            if (emoji.name == '👎') {
                embed.color = randomColor ('orange');
                embed.fields[2].value = 'Your purchase was cancelled'
                sentMessage.edit ({content: member.mention + ',', embed: embed});
                return collector.stop ('automated')
            }
            userInfo = await getUserInfo (member, guild);
            userInfo.money -= price;
            embed.color = randomColor ('blue');
            embed.fields[2].value = 'Your purchase is verified';
            sentMessage.edit ({content: member.mention + ',', embed: embed});
            postPurchase (settingsSplit, itemProperties, userInfo)
            collector.stop ('automated');
        })
        collector.on ('end', async (collected, reason) => {
            if (reason == 'automated') return;
            embed.color = randomColor ('orange');
            embed.fields[2].value = 'You failed to verify the payment';
            sentMessage.edit ({content: member.mention + ',', embed: embed});
        })
    }
}

function getPrice (settingsSplit, itemProperties, userInfo) {
    let price = 'error';
    switch (itemProperties.name.toLowerCase()) {
        case 'gift':
            settingsSplit.forEach (ele => {
                let eleSplit = ele.split(/: ?`/);
                if (itemProperties.inputs.val.alias.includes (eleSplit[0])) price = parseFloat(eleSplit[1]);
            });
            if (price == 'error') price = 25;
            break;
        case 'personal car':
            price = 14950;
            if (userInfo.items && userInfo.items.includes ('Personal Car')) price = 'limited';
            break;
        case 'sailboat':
            price = 4950;
            if (userInfo.items && userInfo.items.includes ('Sailboat')) price = 'limited';
            break;
        case 'private jet':
            price = 2495000;
            if (userInfo.items && userInfo.items.includes ('Private Jet')) price = 'limited';
            break;
    }
    return price;
}

async function postPurchase (settingsSplit, itemProperties, userInfo) {
    switch (itemProperties.name.toLowerCase()) {
        case 'gift':
            let price = 'error';
            settingsSplit.forEach (ele => {
                let eleSplit = ele.split(/: ?`/);
                if (itemProperties.inputs.val.alias.includes (eleSplit[0])) price = parseFloat(eleSplit[1]);
            });
            if (price == 'error') price = 25;
            userInfo.experience = (userInfo.experience || 0) + (price / 200);
            let lowUserInfo = await lowestUserInfo (userInfo.guildID);
            lowUserInfo.money = lowUserInfo.money + (price * 0.9);
            lowUserInfo.save();
            break;
        case 'personal car':
            userInfo.experience =+ 0.2
            userInfo.items.push ('Personal Car');
            break;
        case 'sailboat':
            userInfo.experience =+ 0.1
            userInfo.items.push ('Sailboat');
            break;
        case 'private jet':
            userInfo.experience =+ 1.5
            userInfo.items.push ('Private Jet');
            break;
    }
    userInfo.save()
}

function confirmOptions (settingsSplit, itemProperties) {
    let error = false;
    let options = []
    settingsSplit.forEach (ele => {
        let eleSplit = ele.split(/: ?`/);
        if (!eleSplit[1]) return error = true;
        eleSplit[1] = eleSplit[1].replace(/\`/g, '');
        let optionKey = Object.keys (itemProperties.inputs).find (ele => itemProperties.inputs[ele].alias.includes(eleSplit[0]))
        if (!optionKey) return error = true;
        if (itemProperties.inputs[optionKey].input == 'integer') {
            eleSplit[1] = parseFloat(eleSplit[1]);
            if (isNaN(eleSplit[1]) == true) return error = true;
        }
        options.push ({name: itemProperties.inputs[optionKey].name, value: eleSplit[1].toString(), inline: true});
    })
    if (error == true) options = null;
    return options;
}

async function lowestUserInfo (guildID) {
    let userInfo = await userInfoDB.find ({
        guildID: guildID
    })
    userInfo.sort ((a,b) => a.money - b.money)
    return userInfo[0];
}