const {randomColor, getUserInfo} = require ('./functions');

module.exports = async (message, args, command, reason, additional) => {
    const configCommand = config.commands[command.toLowerCase()];
    let embed = {
        title: 'Error - ' + ((configCommand == null) ? command : configCommand.name),
        description: 'Sorry ' + message.member.mention + ', for help and information, say `-help' + ((configCommand == null) ? '' : ' ' + configCommand.name.toLowerCase()) + '`',
        color: randomColor ('orange'),
        timestamp: new Date().toISOString(),
    }
    switch (reason) {
        case 'invalidUsage':
            embed.fields = [{name: 'Usage Error:', value: 'The command syntax was inputted incorrectly', inline: false}]
            additional.forEach (add => {
                let description = inputted (configCommand.arguments[add].items);
                embed.fields.push ({name: '❯ ' + configCommand.arguments[add].name + ':', value: description, inline: false});
            })
            break;
        case 'money':
            embed.fields = [
                {name: 'Currency Error:', value: 'You don\'t have enough money for accomplish that task.', inline: false},
                {name: '❯ Transaction Information:', value: 'Action: `' + additional[0] + '`|\nPrice: `' + toCurrencyFormat (additional[1]) + '`|\nBalance: `' + toCurrencyFormat (additional[2]) + '`'}
            ]
            break;
        case 'general':
            embed.fields = [ 
                {name: 'General Error:', value: 'Something went wrong with the command, the error handler didn\'t catch it.', inline: false},
                {name: '❯ Possible Solutions:', value: '1: `Try the Help command`|\n2: `Ask an admin about the problem`|\n3: `Try again later`', inline: false}
            ]
            break;
        case 'permission':
            embed.fields = [{name: 'Permission Error:', value: 'You don\'t have the permissions to execute that action.', inline: false}]
            if (additional[0]) embed.fields.push ({name: '❯ Minimal Permission:', value: additional[0].mention, inline: false})
            else embed.fields.push ({name: '❯ Possible Solutions:', value: '1: `If applicable, try the command on someone else`|\n2: `Ask an admin about the problem`', inline: false})
            break;
        case 'employment':
            embed.fields = [{name: 'Employment Error:', value: 'You are required to have a specified occupation to execute that action.', inline: false}]
            if (additional[0]) embed.fields.push ({name: '❯ Required Occupation:', value: additional[0], inline: false})
            else embed.fields.push ({name: '❯ Possible Solutions:', value: '1: `Acquire an occupation using -job`|\n 2: `Independently start a job or company`', inline: false})
            break;
        case 'notCommand':
            message.channel = message.channel.guild.channels.find(ele => ele.id == process.env.CHANNEL_BOT)
            embed.fields = [
                {name: 'Viability Error:', value: 'That command doesn\'t exist or hasn\'t been developed yet.', inline: false},
                {name: '❯ Commands:', value: '`' + config.commands.help.arguments.command.items.join('`| `') + '`', inline: false}
            ]
            break;
        case 'channel':
            let channelNameArray = [];
            message.channel = message.channel.guild.channels.find(ele => ele.id == process.env.CHANNEL_BOT);
            const channelArrayObject = [{name: 'spam', id: process.env.CHANNEL_SPAM}, {name: 'bot', id: process.env.CHANNEL_BOT}, {name: 'store', id: process.env.CHANNEL_STORE}, {name: 'transport', id: process.env.CHANNEL_TRANSPORT}];
            for (const ele of configCommand.channels) {
                if (ele == 'state') {
                    let userInfo = await getUserInfo (message.member, message.channel.guild);
                    if (!userInfo.state) return;
                    let channelObject = message.channel.guild.channels.find (ele2 => config.places[userInfo.state].name.toLowerCase() == ele2.name.toLowerCase() && ele2.type == 4)
                    channelObject.channels.forEach (ele2 => channelNameArray.push (ele2.mention))
                }
                else {
                    let arrayElement = channelArrayObject.find(ele2 => ele2.name == ele)
                    let channelObject = message.channel.guild.channels.find (ele2 => ele2.id == arrayElement.id);
                    if (channelObject.type == 4) {
                        channelObject.channels.forEach (ele2 => channelNameArray.push (ele2.mention))
                    }
                    else channelNameArray.push (channelObject.mention)
                }
            }
            embed.fields = [
                {name: 'Channel Error:', value: 'This command could only be utilized in certain channels.', inline: false},
                {name: '❯ Channels:', value: channelNameArray.join ('| '), inline: false}
            ]
            break;
        case 'cooldown':
            embed.fields = [
                {name: 'Cooldown Error:', value: 'This command is on cooldown after being used.', inline: false},
                {name: '❯ Cooldown:', value: 'Person: `' + (message.member.nick || message.member.username) + '`|\nCommand: `' + configCommand.name + '`' + ((additional[1]) ? ('|\nSubcommand: `'+ additional[1] + '`') : '') + '|\nCooldown: `' + additional[0] + '`', inline: false}
            ]
            break;
        case 'movement':
            embed.fields = [
                {name: 'Connections Error:', value: 'You can\'t travel from '+ config.places[additional[0]].name + ' to ' + config.places[additional[1]].name + '.', inline: false},
                {name: '❯ Travel from ' + config.places[additional[0]].name + ':', value: inputted (additional[2]), inline: false},
            ]
            if (additional[0] != additional[1]) embed.fields.push ({name: '❯ Travel to ' + config.places[additional[1]].name + ':', value: inputted (additional[3]), inline: false})
            break;
        case 'timing':
            embed.fields = [
                {name: 'Timing Error:', value: 'This command can\'t be used at this given time.', inline: false},
                {name: '❯ Event:', value: 'Command: `' + configCommand.name + '`|\nEvent: `' + additional[0] + '`|\nTiming: `' + additional[1] + '`', inline: false}
            ]
            break;
    }
    return message.channel.createMessage ({content: message.member.mention + ',', embed: embed});
}

function inputted (item) {
    if (typeof item == 'string') {
        return item
    }
    else if (Array.isArray(item)) {
        let itemString = item.toString()
        itemString = itemString.replace (/,/g, '`| `')
        itemString = '`'+ itemString + '`'
        return itemString
    }
    else return item
}

function toCurrencyFormat (number) {
    let parsedInteger = parseInt (number)
	return ((parsedInteger < 0) ? '-' : '') + '$' + Math.abs(parsedInteger).toString().replace(/\B(?=(\d{3})+(?!\d))/g, m = ',')
}