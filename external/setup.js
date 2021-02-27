const guildInfoDB = require ('../database/guildinfo.js');
const workInfoDB = require ('../database/workinfo.js');
const {timeout, randomColor} = require ('./functions');

module.exports = {
    name: 'setup',
    summoner: ['setup'],
    async execute (message, args) {
        if (message.member.id == config.discordInfo.owner) {
            if (args[1] == '1') {
                let channelArray = message.channel.guild.channels.filter (ele => ele.name == '╙◖public-domain◗')
                channelArray.forEach (ele => {
                    let parentChannel = message.channel.guild.channels.find (ele2 => ele.parentID == ele2.id);
                    let state = Object.keys(config.places).find (ele2 => config.places[ele2].name.toLowerCase() == parentChannel.name.toLowerCase());
                    ele.edit ({
                        topic: 'This is the state of ' + config.places[state].name + ', enjoy talking with other ' + config.places[state].demonym + '.' + 
                        '\n__**State Information:**__ ' + 
                        '\n**Name:** ' + config.places[state].name +
                        '\n**Postal Code:** ' + config.places[state].postalCode + 
                        '\n**Coordinates:** ' + config.places[state].x + ',' + config.places[state].y
                    })
                })
            }
            else if (args[1] == '2') {
                let embed = {
                    timestamp: new Date().toISOString(),
                    color: randomColor ('blue'),
                    title: 'Server Information',
                    description: 'Be employed in our economy! Participate in the digital elections! Travel between the 50 states! Meet people with similar interests! Start your own business and become an entrepreneur! This server is a Discord recreation of the United States of America using geographical landmarks.',
                    fields: [
                        {name: 'What are the rules?', value: 'Follow Discord\'s Terms of Service requirements and Community Guidelines, be respectful of other people, and use reasonable judgement.'},
                        {name: 'How do I make money?', value: 'Simply seek employment. You can easily find a job working for the government using `-job catalog gov`. If you decided to become a soldier, type `-job apply gov soldier`.'},
                        {name: 'How do I move states?', value: 'To use the travel command, you must specify your method of transportation and the state. For example, you would want to travel to California by a car, type `-travel drv ca`.'},
                        {name: 'How do I become a governor?', value: 'Start by waiting till your state starts an election (every 50 days). Type `-election run [input your election speech]` to run for election in the state. Type `-election vote [mention yourself]` to vote for yourself during the voting period.'},
                        {name: 'What are rich texts?', value: 'They allows you to add specific properties. For example, if a command has the option to turn an object red and include a message, it would look like `-example color: ´red´| message: ´Hello World´` (Replace ´ with a backtick).'}
                    ]
                }
                message.channel.createMessage ({content: '@everyone,', embed: embed})
            }
            else if (args[1] == '3') {
                let embed = {
                    timestamp: new Date().toISOString(),
                    color: randomColor ('blue'),
                    title: 'Important Information',
                    description: 'If you can read this, it is highly probable that the Discord bot, Unicus, is sleeping.',
                    fields: [
                        {name: 'Reasons:', value: '`1:` The bot is being updated and reloaded\n`2:` The server hosting the bot is down.\n`3:` The bot was malfunction when assigning roles.'},
                    ]
                }
                message.channel.createMessage ({content: '@everyone,', embed: embed})
            }
            else if (args[1] == '4') {
                embedCreation (message, args, message.channel);
            }
            else if (args[1] == '5') {
                let sendingChannel = message.channel.guild.channels.find (ele => ele.id == args[2]);
                args = args.splice (2, 1)
                embedCreation (message, args, sendingChannel)
            }
            else if (args[1] == '6') {
                let embed = {
                    timestamp: new Date().toISOString(),
                    color: randomColor ('all'),
                    title: 'Limited Time Deal',
                    description: '[Our business partner had just released a new deal on ebay, use our referral code for a discount! Deal ends in 24 hours. First come, first serve!](https://www.ebay.com/)',
                    image: {url: message.attachments[0].url}
                }
                let sendChannel = await message.author.getDMChannel();
                sendChannel.createMessage ({content: '', embed: embed})
            }
            else if (args[1] == '7') {
                let sendChannel = message.channel.guild.channels.find (ele => ele.id == args[2]);
                let embedStart = {
                    timestamp: new Date().toISOString(),
                    color: randomColor ('blue'),
                    title: 'Welcome Newcomer',
                    description: 'To get the **Citizen** role you must provide some information to personalize your account.',
                    fields: [
                        {name: 'Instructions', value: 'Type `-info <argument:string> <input:string>`. For example: `-info FirstName John`.', inline: false},
                        {name: 'All Arguments', value: 'First Name - FirstName; Middle Initial - MiddleName; Last Name - LastName; Address Line 1 - Address1; Address Line 2 - Address2; Phone Number - PhoneNumber;', inline: false},
                    ]
                }
                sendChannel.createMessage ({content: '', embed: embedStart})
                await timeout (20000)
                let embedEnd = {
                    timestamp: new Date().toISOString(),
                    color: randomColor ('orange'),
                    title: 'Welcome Newcomer',
                    description: 'Please confirm the information provided to receive the **Citizen** role.',
                    fields: [
                        {name: 'First Name', value: 'Kyle', inline: true},
                        {name: 'Middle Initial', value: 'J', inline: true},
                        {name: 'Last Name', value: 'Smith', inline: true},
                        {name: 'Address Line 1', value: '5965 Madrano Drive', inline: true},
                        {name: 'Address Line 2', value: 'Sarasota FL 34232', inline: true},
                        {name: 'Phone Number', value: '07494795709', inline: true}
                    ]
                }
                sendChannel.createMessage ({content: '', embed: embedEnd})
            }
            else if (args[1] == '8') {
                let embed = {
                    title: 'Election - Application',
                    description: 'The local election will begin soon, type `-election run <speech:message>` to run as a candidate.',
                    color: randomColor ('orange'),
                    timestamp: new Date().toISOString(),
                    fields: [
                        {name: 'State:', value: 'Florida', inline: true},
                        {name: 'Population:', value: '1', inline: true},
                        {name: 'Governor:', value: '@FiNS Flexin', inline: true}
                    ]
                }
                message.channel.createMessage ({content: '@everyone,', embed: embed})
            }
            else if (args[1] == '9') {
                let voiceChannel = message.channel.guild.channels.find (ele => ele.id == args[2]);
                let voiceConnection = await voiceChannel.join()
                voiceConnection.play ('a b c d e f g h i j k l m n o p q r s t u v w x y z')
            }
        }
    }
}

function embedCreation (message, args, channel) {
    const index = message.content.toLowerCase().indexOf(args[2]);
    const settings = message.content.substring(0, message.content.length - 1).slice(index).replace (/\[n]/g, '\n');
    const settingsSplit = settings.split ('`| ');
    const settingsConfig = config.commands.setup.arguments.embedSettings.inputs;
    let embed = {}; let content;
    settingsSplit.forEach (ele => {
        let eleSplit = ele.split(/: ?`/);
        let backTickNumber = (eleSplit[1].split('`').length - 1);
        if (!eleSplit [1] || eleSplit[2] || 1 == backTickNumber % 2);
        else if (settingsConfig.fld.includes (eleSplit[0])) {
            let eleSplit2 = eleSplit[1].split(/` `/g);
            let inline = (config.discordInfo.boolean.true.includes (eleSplit2[2])) ? 'true' : 'false';
            if (embed.fields && !eleSplit2[3]) return embed.fields.push ({name: eleSplit2[0], value: eleSplit2[1], inline: inline});
            else if (!eleSplit2[3]) return embed.fields = [{name: eleSplit2[0], value: eleSplit2[1], inline: inline}]
        }
        else if (eleSplit[1].includes ('`'));
        else if (settingsConfig.con.includes (eleSplit[0]) && !content) return content = eleSplit[1];
        else if (settingsConfig.ttl.includes (eleSplit[0]) && !embed.title) return embed.title = eleSplit[1];
        else if (settingsConfig.des.includes (eleSplit[0]) && !embed.description) return embed.description = eleSplit[1];
        else if (settingsConfig.rgb.includes (eleSplit[0]) && !embed.color) return embed.color = parseInt (eleSplit[1], 16);
        else if (settingsConfig.pic.includes (eleSplit[0]) && !embed.image) return embed.image = {url: eleSplit[1]};
        return embed.error = true;
    })
    embed.timestamp = new Date().toISOString();
    if (embed.error) return errorLog (message, args, 'Setup', 'invalidUsage', ['embedSettings']);
    try {channel.createMessage ({content: content || ' ', embed: embed})}
    catch {return errorLog (message, args, 'Setup', 'invalidUsage', ['embedSettings'])};
}