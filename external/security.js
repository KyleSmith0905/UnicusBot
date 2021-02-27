const securityConfig = config.commands.security;
const {randomColor, getUserInfo} = require ('./functions');
const userInfoDB = require ('../database/userinfo.js');

client.on ('ready', () => {
    client.guilds.forEach (guild => {
        cron.schedule ('0 */10 * * * *', async () => {
            let userInfos = await userInfoDB.find ({
                guildID: guild.id,
                'moderation.muted': true
            })
            userInfos.forEach (async ele => {
                if (ele.moderation && ele.moderation.timestampEnd >= Date.now()) {
                    let reported = guild.members.find (ele2 => ele2.id == ele.userID)
                    embed = {
                        title: 'Security - Unmute',
                        color: randomColor ('blue'),
                        timestamp: new Date().toISOString(),
                        description: reported.mention + ', the mute held against you is over, you should now have full access to all chat capabilities now.'
                    }
                    let channelDM = await reported.user.getDMChannel();
                    channelDM.createMessage ({content: reported.mention + ',', embed: embed})
                    reported.edit ({roles: ele.moderation.priorRoles}, 'automated')
                    setUserInfo (ele, {moderation: {muted: false}})
                }
            })
        })
    })
})

module.exports = {
    name: 'security',
    summoner: securityConfig.alias,
    cooldown: 1,
    async execute (message, args) {
        let channel = message.channel;
        let guild = channel.guild;
        let member = message.member;
        let ruleChannel = guild.channels.find (ele => ele.id == process.env.CHANNEL_INFO);
        let securityRole = guild.roles.find (ele => ele.id == process.env.ROLE_ENFORCEMENT);
        if (!member.roles.includes (securityRole.id)) return errorLog (message, args, 'Security', 'permission', [securityRole])
        let errors = []
        let reportedID = (args[2]) ? (args[2].match(/^<@!?(\d+)>$/) || args[2]) : null;
        if (Array.isArray (reportedID)) reportedID = reportedID[1];
        let reported = (args[2]) ? guild.members.find (ele => ele.id == reportedID) : null;
        if (reported == null || reported.id == member.id || reported.bot) errors.push ('target');
        let inputKey = Object.keys (securityConfig.arguments.accusation.inputs).find (ele => securityConfig.arguments.accusation.inputs[ele].alias.includes (args[1]));
        let inputConfig = securityConfig.arguments.accusation.inputs[inputKey];
        if (inputKey == null) return errorLog (message, args, 'security', 'invalidUsage', ['accusation']);
        if (!inputConfig.name && !args[3]) errors.push ('title');
        if (!args[(inputConfig.name) ? 3 : 4]) errors.push ('explanation');
        if (errors.length) return errorLog (message, args, 'Security', 'invalidUsage', errors);
        let role = highRoleWins (guild, member.id, reported.id, message, args);
        if (role == false) return;
        let name = (!inputConfig.name) ? args[3].charAt(0).toUpperCase() + args[3].slice(1) : inputConfig.name;
        let index = message.content.toLowerCase().indexOf(args[(inputConfig.name) ? 3 : 4]);
        let content = message.content.slice(index).replace(/[\r\n]+/gm,' ');
        if (content.length >= 256) content = content.slice(0, 255) + '...';
        let channelDM = await reported.user.getDMChannel();
        let warn = (inputConfig.warn) ? await addWarn (member, reported, guild, ((!inputConfig.name) ? 'C - ' : '') + name, content, channelDM, message) : true;
        if (warn == false) return
        let adminEmbed = {
            title: 'Security - ' + name,
            color: randomColor (inputConfig.color || 'orange'),
            timestamp: new Date().toISOString(),
            description: reported.user.mention + ' ' + inputConfig.adminDescription + ((inputConfig.name) ? '' : ' ' + name.toLowerCase() + '.'),
            fields: []
        }
        adminEmbed = pushInformation (adminEmbed, content, guild.name, reported.mention, member.mention)
        let adminMessage = await channel.createMessage ({content: member.mention + ',', embed: adminEmbed})
        let embed = adminEmbe;d;
        embed.description = reported.user.mention + ', ' + inputConfig.description;
        if (inputConfig.prompt) embed.fields.push ({name: 'Prompt', value: inputConfig.prompt.field, inline: false})
        let sentMessage = await channelDM.createMessage ({content: reported.mention + ',', embed: embed});
        if (inputConfig.prompt) {
            inputConfig.prompt.emoji.forEach (ele => sentMessage.addReaction (ele))
            let filter = (mes, emj, usr) => (inputConfig.prompt.emoji.includes(emj.name)) && usr != client.user.id;
            let collector = new reactionCollector (client, sentMessage, filter, {time: 86400000});
            collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                let emojiConfig = inputConfig.prompt[emoji.name];
                if (emojiConfig.invite) {
                    let invite = await ruleChannel.createInvite ({maxAge: 0, maxUses: 1, unique: false}, 'Automated')
                    emojiConfig.field = emojiConfig.field + invite.code + '.'
                }
                embed.color = randomColor (emojiConfig.color);
                adminEmbed.color = randomColor (emojiConfig.color);
                embed.fields[4] = {name: 'Prompt', value: emojiConfig.field, inline: false}
                adminEmbed.description = reported.mention + ' ' + emojiConfig.adminField;
                sentMessage.edit ({content: reported.mention + ',' ,embed: embed});
                adminMessage.edit ({content: member.mention + ',' , embed: adminEmbed});
                if (emojiConfig.kick) reported.kick ('Security - ' + name + ' | ' + member.mention)
                collector.stop ('Automated');
            })
            collector.on ('end', async (collected, reason) => {
                if (reason == 'Automated') return;
                let emojiConfig = inputConfig.prompt['end']
                if (emojiConfig.invite) {
                    let invite = await ruleChannel.createInvite ({maxAge: 0, maxUses: 1, unique: false}, 'Automated');
                    emojiConfig.field = emojiConfig.field + invite.code + '.';
                }
                embed.color = randomColor (emojiConfig.color);
                adminEmbed.color = randomColor (emojiConfig.color);
                embed.fields[4] = {name: 'Prompt', value: emojiConfig.field, inline: false}
                adminEmbed.description = reported.mention + ' ' + emojiConfig.adminField;
                sentMessage.edit ({content: reported.mention + ',' ,embed: embed});
                adminMessage.edit ({content: member.mention + ',', embed: adminEmbed});
                if (emojiConfig.kick) reported.kick ('Security - ' + name + ' | ' + member.mention)
            })
        }
    }
}

function highestRole (guild, memberID) {
    let guildMember = guild.members.find (ele => ele.id == memberID)
    let roleArray = []; guild.roles.forEach (ele => (guildMember.roles.includes (ele.id) ? roleArray.push (ele) : null))
    let topRole = roleArray.sort((a, b) => b.position - a.position) [1]
    return topRole;
}

function highRoleWins (guild, memberID1, memberID2, message, args) {
    let reporterRole = highestRole (guild, memberID1);
    let reportedRole = highestRole (guild, memberID2);
    if (reporterRole.position <= reportedRole.position) {
        let requiredRole = guild.roles.find (ele => ele.position == (reportedRole.position + 1));
        errorLog (message, args, 'Security', 'permission', [requiredRole]);
        return false;
    }
    else return true;
}

async function addWarn (member, reported, guild, reason, content, channelDM, message) {
    let userInfo = await getUserInfo (reported, guild);
    let modInfo = userInfo.moderation || null;
    if (!modInfo.warnType || modInfo.warnType == 0) {
        userInfo.moderation = {warnType: [reason], muted: false};
        userInfo.save();
        return true;
    }
    let warnNumber = modInfo.warnType.length + 1;
    modInfo.warnType.push (reason);
    let confirm = true; let date = null; let priorRoles = null;
    if (warnNumber >= 3) {
        let present; let past;
        if (warnNumber == 3) {present = '10-Minute Mute'; past = 'muted for 10 minutes';}
        else if (warnNumber == 4) {present = '2-Day Mute'; past = 'muted for 2 days';}
        else {present = '1-Month Mute'; past = 'muted for 1 month';}
        let embed = {
            title: 'Security - ' + reason,
            color: randomColor ('orange'),
            timestamp: new Date().toISOString(),
            description: reported.mention + ', you have been ' + past + ' because your account has faced multiple reports for various activities, most recently you were reported for' + reason,
            fields: []
        }
        embed = pushInformation (embed, content, guild.name, reported.mention, member.mention)
        embed.fields.push (
            {name: 'Total:', value: warnNumber + ' Reports', inline: true},
            {name: 'Types:', value: '`' + modInfo.warnType.toString().replace(/,/g, '`| `') + '`', inline: true},
            {name: 'Action:', value: present, inline: true}
        )
        channelDM.createMessage ({content: reported.mention + ',', embed: embed});
        if (modInfo.muted == false) priorRoles = reported.roles;
        let roleArrayID = process.env.ROLE_PRISONER.split(','); confirm = false;
        reported.edit({roles: roleArrayID});
        let fromMili = (warnNumber == 3) ? 600000 : (warnNumber == 4) ? 172800000 : 2629800000;
        date = new Date(Date.now() + fromMili)
        embed.description = reported.mention + ' has been muted for ' + reason + '. They will be unmuted by the date: ' + date.toLocaleString('en-US') + '.',
        message.channel.createMessage ({content: member.mention + ',', embed: embed})
    }
    userInfo.experience -= 0.75
    if (userInfo.experience < 2) userInfo.experience = 2;
    userInfo.moderation.warnType = modInfo.warnType;
    userInfo.muted = !confirm;
    userInfo.timeStampEnd = date;
    userInfo.priorRoles = (priorRoles) ? priorRoles : modInfo.priorRoles
    userInfo.save();
    return confirm;
}

function pushInformation (embed, content, guildName, reportedMention, reporterMention) {
    embed.fields.push (
        {name: 'Report:', value: content, inline: false},
        {name: 'Guild:', value: guildName, inline: true},
        {name: 'Reported:', value: reportedMention, inline: true},
        {name: 'Reporter:', value: reporterMention, inline: true}
    )
    return embed;
}