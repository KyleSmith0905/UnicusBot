const governorConfig = config.commands.governor;
const commandConfig = governorConfig.arguments.command.inputs;
const {randomColor, getUserInfo, timeout} = require ('./functions');
const stateInfoDB = require ('../database/stateinfo.js');

module.exports = {
    name: 'governor',
    summoner: governorConfig.alias,
    cooldown: 2,
    async execute (message, args) {
        const member = message.member;
        const guild = message.channel.guild;
        const userInfo = await getUserInfo (member, guild);
        const memberRoles = member.roles;
        const governorRole = guild.roles.find (ele => memberRoles.includes (ele.id) && ele.name.endsWith('Governor'));
        if (!governorRole) return errorLog (message, args, 'Governor', 'permission', [governorRole]);
        const state = governorRole.name.split(' ')[0];
        const stateConfig = config.places[state.toLowerCase()];
        const stateCategory = guild.channels.find (ele => ele.name == stateConfig.name.toLowerCase() && ele.type == 4);
        if (commandConfig.ban.includes (args[1])) {
            let errors = [];
            let targetID = args[2].match(/^<@!?(\d+)>$/) || args[2];
            if (Array.isArray (targetID)) targetID = targetID[1];
            const target = (args[2]) ? guild.members.find (ele => ele.id == targetID) : null;
            const targetInfo = (target) ? await getUserInfo (target, guild) : null;
            if (!target || targetInfo.state != userInfo.state) errors.push ('target');
            if (!args[3]) errors.push ('explanation');
            if (errors.length) return errorLog (message, args, 'Governor', 'invalidUsage', errors);
            stateCategory.editPermission (target.id, '0', '1024', 'member');
            const index = message.content.toLowerCase().indexOf(args[3]);
            let content = message.content.slice(index).replace(/[\r\n]+/gm,' ');
            if (content.length >= 256) content = content.slice(0, 255) + '...';
            const channelDM = await target.user.getDMChannel();
            adminEmbed = {
                timestamp: new Date().toISOString(),
                title: 'Governor - Ban',
                color: randomColor ('orange'),
                description: target.mention + ' has been banned from ' + stateConfig.name + ', however, they can still vote in local election\'s.',
                fields: [
                    {name: 'Report:', value: content, inline: false},
                    {name: 'Guild:', value: guild.name + ' - ' + stateConfig.name, inline: true},
                    {name: 'Reported:', value: target.mention, inline: true},
                    {name: 'Reporter:', value: message.member.mention, inline: true}
                ]
            }
            await message.channel.createMessage ({content: member.mention + ',', embed: adminEmbed})
            let embed = adminEmbed;
            embed.description = target.user.mention + ', you\'ve just been banned from ' + stateConfig.name + ', fortunately you can still vote in local elections.'
            await channelDM.createMessage ({content: target.mention + ',', embed: embed});
        }
        else if (commandConfig.unb.includes (args[1])) {
            let errors = [];
            let targetID = args[2].match(/^<@!?(\d+)>$/) || args[2];
            if (Array.isArray (targetID)) targetID = targetID[1];
            const target = (args[2]) ? guild.members.find (ele => ele.id == targetID) : null;
            const targetInfo = (target) ? await getUserInfo (target, guild) : null;
            if (!target || targetInfo.state != userInfo.state) errors.push ('target');
            if (!args[3]) errors.push ('explanation');
            if (errors.length) return errorLog (message, args, 'Governor', 'invalidUsage', errors);
            stateCategory.deletePermission (target.id);
            const index = message.content.toLowerCase().indexOf(args[3]);
            let content = message.content.slice(index).replace(/[\r\n]+/gm,' ');
            if (content.length >= 256) content = content.slice(0, 255) + '...';
            const channelDM = await target.user.getDMChannel();
            adminEmbed = {
                timestamp: new Date().toISOString(),
                title: 'Governor - Unban',
                color: randomColor ('blue'),
                description: target.mention + ' has been unbanned from ' + stateConfig.name + '.',
                fields: [
                    {name: 'Report:', value: content, inline: false},
                    {name: 'Guild:', value: guild.name + ' - ' + stateConfig.name, inline: true},
                    {name: 'Reported:', value: target.mention, inline: true},
                    {name: 'Reporter:', value: message.member.mention, inline: true}
                ]
            }
            await message.channel.createMessage ({content: member.mention + ',', embed: adminEmbed})
            let embed = adminEmbed;
            embed.description = target.user.mention + ', you\'ve just been unbanned from ' + stateConfig.name + ', you can now view and talk in their channels like normal.'
            await channelDM.createMessage ({content: target.mention + ',', embed: embed});
        }
        else if (commandConfig.chn.includes (args[1])) {
            const subcommandConfig = governorConfig.arguments.action.inputs;
            let embed;
            if (subcommandConfig.crt.includes (args[2])) {
                let channelType;
                if (governorConfig.arguments.channelType.inputs.voc.includes (args[3]) && !args[4]) channelType = '2'
                else if ((governorConfig.arguments.channelType.inputs.txt.includes (args[3]) || !args[3]) && !args[4]) channelType = '0';
                else return errorLog (message, args, 'Governor', 'invalidUsage', ['channelType']);
                const stateRole = guild.roles.find (ele => ele.name.toLowerCase() == stateConfig.name.toLowerCase());
                const newChannel = await guild.createChannel (((channelType == '0') ? '╟╸text' : '┇╸voice') + '-channel╺', channelType, {parentID: stateCategory.id})
                newChannel.editPermission (stateRole.id, 1024, 0, 'role');
                if (channelType == '0') {
                    await timeout (500);
                    newChannel.editPosition (stateCategory.position + 1)
                }
                embed = {
                    timestamp: new Date().toISOString(),
                    title: 'Governor - Channel',
                    color: randomColor ('blue'),
                    description: member.mention + ' created the channel ' + newChannel.name.substring (1) + '.',
                    fields: [
                        {name: 'State:', value: stateConfig.name, inline: true},
                        {name: 'Channel:', value: newChannel.mention, inline: true},
                        {name: 'Executor:', value: member.mention, inline: true}
                    ]
                }
            }
            else if (subcommandConfig.del.includes (args[2])) {
                let oldChannelID = args[3].match(/^<#(\d+)>$/) || args[3];
                if (Array.isArray (oldChannelID)) oldChannelID = oldChannelID[1];
                const oldChannel = (args[3]) ? stateCategory.channels.find (ele => ele.id == oldChannelID && !ele.name.startsWith('╙')) : null;
                if (!oldChannel || args[4]) return errorLog (message, args, 'Governor', 'invalidUsage', ['channel']);
                embed = {
                    timestamp: new Date().toISOString(),
                    title: 'Governor - Channel',
                    color: randomColor ('orange'),
                    description: member.mention + ', are you sure you want to delete ' + oldChannel.name.substring(1) + '? This can\'t be reversed.',
                    fields: [
                        {name: 'State:', value: stateConfig.name, inline: true},
                        {name: 'Channel:', value: oldChannel.mention, inline: true},
                        {name: 'Executor:', value: member.mention, inline: true}
                    ]
                }
                const sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
                sentMessage.addReaction ('👍');
                const filter = (mes, emj, usr) => (emj.name == '👍') && (usr == member.id);
                const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
                collector.on ('collect', async (sentMessage2nd, emoji, userID) => {    
                    oldChannel.delete()
                    embed.description = member.mention + ' deleted the channel ' + oldChannel.name.substring(1) + '.',
                    sentMessage.edit ({content: member.mention + ',', embed: embed});
                    collector.stop ('confirmed');
                })
                collector.on ('end', (collected, reason) => {
                    sentMessage.removeReactions ();
                    if (reason == 'confirmed') return
                    embed.description = member.mention + ' you didn\'t the channel ' + oldChannel.name.substring(1) + ' in time.';
                    sentMessage.edit ({content: member.mention + ',', embed: embed});
                })
                return;
            }
            else if (subcommandConfig.upd.includes (args[2])) {
                const oldChannelID = mentionedInput (args[3]);
                const updatedChannel = (oldChannelID) ? stateCategory.channels.find (ele => ele.id == oldChannelID && !ele.name.startsWith('╙')) : null;
                errors = [];
                if (!updatedChannel) errors.push ('channel');
                const index = message.content.toLowerCase().indexOf(args[4]);
                const settings = message.content.substring(0, message.content.length - 1).slice(index).replace (/\[n]/g, '\n');
                const settingsSplit = settings.split ('`| ');
                const settingsConfig = governorConfig.arguments.settings.inputs;
                let newChannelObject = {}; let channelPerms = []
                settingsSplit.forEach (ele => {
                    let eleSplit = ele.split(/: ?`/);
                    let backTickNumber = (eleSplit[1].split('`').length - 1);
                    if (!eleSplit[1] || eleSplit[2] || 1 == backTickNumber % 2);
                    else if (settingsConfig.prm.includes (eleSplit[0])) {
                        let eleSplit2 = eleSplit[1].split(/` `/g);
                        let mentionedID = mentionedInput (eleSplit2[0]);
                        let permissionOverwrite = updatedChannel.permissionOverwrites.find (ele => ele.id = mentionedID)
                        let mentionedObject = guild.roles.find (ele => ele.id == mentionedID && (ele.name.toLowerCase() == stateConfig.name.toLowerCase() || ele.name.toLowerCase().startsWith (stateConfig.postalCode.toLowerCase())));
                        if (!mentionedObject) mentionedObject = guild.members.find (ele => ele.id == mentionedID);
                        if (eleSplit2[2] == ' ') eleSplit2[2] = permissionOverwrite.allow
                        if (mentionedObject && eleSplit2[2]) return channelPerms.push ({overwriteID: mentionedObject.id, allow: eleSplit2[2], deny: (eleSplit2[3] || permissionOverwrite.deny), type: ((mentionedObject.user) ? 'member' : 'role'), name: (mentionedObject.nick || mentionedObject.username || mentionedObject.name)})
                    }
                    else if (eleSplit[1].includes ('`'));
                    else if (settingsConfig.nam.includes (eleSplit[0]) && !newChannelObject.name) return newChannelObject.name = ((!updatedChannel || updatedChannel.type == 0) ? '╟' : '┇') + eleSplit[1];
                    else if (settingsConfig.tpc.includes (eleSplit[0]) && !newChannelObject.topic) return newChannelObject.topic = eleSplit[1];
                    else if (settingsConfig.rte.includes (eleSplit[0]) && !newChannelObject.rateLimitPerUser) return newChannelObject.rateLimitPerUser = eleSplit[1];
                    else if (settingsConfig.nsf.includes (eleSplit[0]) && !newChannelObject.nsfw) return newChannelObject.nsfw = eleSplit[1];
                    else if (settingsConfig.usr.includes (eleSplit[0]) && !newChannelObject.userLimit) return newChannelObject.userLimit = eleSplit[1];
                    else if (settingsConfig.bit.includes (eleSplit[0]) && !newChannelObject.bitrate) return newChannelObject.bitrate = eleSplit[1];
                    return newChannelObject.error = true;
                })
                if (newChannelObject.error == true || (settings && !message.content.endsWith ('`'))) errors.push ('settings');
                if (errors.length) return errorLog (message, args, 'Governor', 'invalidUsage', errors);
                if (newChannelObject) {
                    try {updatedChannel.edit (newChannelObject)}
                    catch {return errorLog (message, args, 'Governor', 'invalidUsage', 'settings')}
                }
                Object.keys(newChannelObject).forEach (ele => newChannelObject[ele] = ((newChannelObject[ele].length >= 48) ? newChannelObject[ele].substring(0, 47) + '...' : newChannelObject[ele]))
                const changeToString = JSON.stringify(newChannelObject);
                let changeString = changeToString.replace(/[{}"]/g, '').replace(/:/g, ': `').replace (/,/g, '`|\n') + '`';
                if (changeString == '`') changeString = ''
                changeString.replace (/``/g, '`[EMPTY]`')
                if (channelPerms.length) channelPerms.forEach (ele => {
                    updatedChannel.editPermission(ele.overwriteID, ele.allow, ele.deny, ele.type)
                    changeString = changeString + ((changeString) ? '|\n' : '') + 'permissionOverwrite: `' + ele.name + ' ' + ele.allow + ' ' + ele.deny + '`'
                })
                embed = {
                    timestamp: new Date().toISOString(),
                    title: 'Governor - Channel',
                    color: randomColor ('white'),
                    description: member.mention + ' updated the channel ' + updatedChannel.name.substring(1) + '.',
                    fields: [
                        {name: 'State:', value: stateConfig.name, inline: true},
                        {name: 'Channel:', value: updatedChannel.mention, inline: true},
                        {name: 'Executor:', value: member.mention, inline: true},
                        {name: 'Changes:', value: changeString, inline: true}
                    ]
                }
            }
            else return errorLog (message, args, 'Governor', 'invalidUsage', ['action']);
            await message.channel.createMessage ({content: member.mention + ',', embed: embed})
        }
        else if (commandConfig.wlc.includes (args[1])) {
            const stateWelcomeChannel = stateCategory.channels.find (ele => ele.name.startsWith('╙'));
            let stateInfo = await getStateInfo (guild, stateConfig.postalCode);
            const index = message.content.toLowerCase().indexOf(args[2]);
            let content = message.content.slice(index).replace(/[\r\n]+/gm,' ');
            if (content.length >= 512) content = content.slice(0, 511) + '...';
            stateInfo.welcomeMessage = content;
            embed = {
                timestamp: new Date().toISOString(),
                title: 'Governor - Welcome',
                color: randomColor ('white'),
                description: member.mention + ' You\'ve ' + ((stateInfo.welcomeMessage)? 'changed the ' : 'created a new ') + ' welcome message for ' + stateConfig.name + '.',
                fields: [
                    {name: 'State:', value: stateConfig.name, inline: true},
                    {name: 'Executor:', value: member.mention, inline: true},
                    {name: 'Channel:', value: stateWelcomeChannel.mention, inline: true},
                    {name: 'Message:', value: content, inline: false}
                ]
            }
            stateInfo.save ()
            await message.channel.createMessage ({content: member.mention + ',', embed: embed})
        }
        else if (commandConfig.ann.includes (args[1])) {
            if (config.discordInfo.boolean.true.includes (args[2])) {
                const index = message.content.toLowerCase().indexOf(args[3]);
                const settings = message.content.substring(0, message.content.length - 1).slice(index).replace (/\[n]/g, '\n');
                const settingsSplit = settings.split ('`| ');
                const settingsConfig = governorConfig.arguments.embedSettings.inputs;
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
                    else if (settingsConfig.ftr.includes (eleSplit[0]) && !embed.footer) return embed.footer = eleSplit[1];
                    else if (settingsConfig.pic.includes (eleSplit[0]) && !embed.image) return embed.image = {url: eleSplit[1]}
                    return embed.error = true;
                })
                if (embed.error) return errorLog (message, args, 'Governor', 'invalidUsage', ['embedSettings']);
                try {message.channel.createMessage ({content: content || ' ', embed: embed})}
                catch {return errorLog (message, args, 'Governor', 'invalidUsage', ['embedSettings'])}
            }
            else {
                const indexOf = (config.discordInfo.boolean.false.includes (args[2])) ? args[3] : args[2];
                const index = message.content.toLowerCase().indexOf(indexOf);
                let content = message.content.slice(index);
                if (content.length >= 1024) content = content.slice(0, 1023) + '...';
                if (!indexOf && !message.attachments[0]) return errorLog (message, args, 'Governor', 'invalidUsage', ['message']);
                else if (!indexOf) content = '';
                if (!message.attachments[0]) return message.channel.createMessage ({content: content});
                else {
                    try {
                        let attachment;
                        await fetch (message.attachments[0].proxy_url)
                        .then(async r => attachment = await r.buffer())
                        message.channel.createMessage ({content: content}, {file: attachment, name: message.attachments[0].filename});
                    }
                    catch {
                        message.channel.createMessage ({content: content})
                    }
                }
            }
            return message.delete()
        }
        else return errorLog (message, args, 'Governor', 'invalidUsage', ['command']);
    }
}

async function getStateInfo (guild, state) {
    let stateInfo = await stateInfoDB.findOne ({
        guildID: guild.id,
        postalCode: state
    })
    if (!stateInfo) {
        const newStateInfo = await new stateInfoDB ({
            guildID: guild.id,
            postalCode: state
        });
        newStateInfo.save();
        stateInfo = newStateInfo
    }
    return stateInfo;
}

function mentionedInput (argument) {
    let inputID = (argument) ? (argument.match(/^<#(\d+)>$/) || argument) : null;
    if (Array.isArray (inputID)) inputID = inputID[1];
    return inputID;
}