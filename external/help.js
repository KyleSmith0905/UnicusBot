const {randomColor} = require ('./functions');

module.exports = {
    name: 'help',
    summoner: config.commands.help.alias,
    execute (message, args) {
        let command = (args[1] ? Object.keys(config.commands).find (ele => config.commands[ele]?.alias?.includes (args[1])) : null);
        let configCommand = config.commands[command];
        let descriptionString = configCommand ? ('The **' + configCommand.name + ' Command** ' + configCommand.description) : ('Below is a list of commands. For further help, the command is `-help [command:string]`.');
        let embed = {
            timestamp: new Date().toISOString(),
            color: randomColor (configCommand ? 'blue' : 'white'),
            title: 'Help' + ((configCommand) ? ' - ' + configCommand.name : ''),
            description: descriptionString,
            fields: []
        }
        if (configCommand) {
            let usage = configCommand.usage;
            let usageArguments = usage.split(/ +/);
            embed.fields.push ({name: 'Usage:', value: '`' + usage + '`', inline: false});
            usageArguments.shift();
            usageArguments.forEach (ele => {
                let arg = ele.match (/[\[<](.*?)[\:|]/);
                if (arg == null) return;
                let items = configCommand.arguments[arg[1]].items;
                if (typeof items == 'string') return embed.fields.push ({name: ele, value: items, inline: false});
                else return embed.fields.push ({name: ele, value: '`' + items.toString().replace(/,/g, '`| `') + '`', inline: false});
            })
        }
        else if (!args[1]) {
            embed.fields.push ({name: 'Commands:', value: '`' + config.commands.help.arguments.command.items.join('`| `') + '`', inline: false})
        }
        else return errorLog (message, args, 'Help', 'invalidUsage', ['command'])
        return message.channel.createMessage ({content: message.member.mention + ',', embed: embed})
    }
}