const {randomColor, timeout, getUserInfo} = require ('./functions');
const stateInfoDB = require ('../database/stateinfo.js');

let logChannel; let welcomeChannel; let allStatesChannel; let guild;
client.on ('ready', async () => {
    guild = client.guilds.find (ele => true)
    logChannel = guild.channels.find (chn => chn.id == process.env.CHANNEL_LOG);
    welcomeChannel = guild.channels.find (chn => chn.id == process.env.CHANNEL_WELCOME);
    allStatesChannel = guild.channels.find (ele => ele.id == process.env.CHANNEL_ALL_STATES);
})

client.on ('inviteCreate', async (guild, invite) => guildInvites.set(guild.id, await guild.getInvites()));

// Members
client.on ('guildMemberAdd', async (guild, member) => {
    console.log (0)
    const userInfo = await getUserInfo (member, guild);
    console.log (1)
    if (!userInfo || !userInfo.roleID || !userInfo.roleID.length) {
        console.log (2)
        let rolesID = [];
        guild.roles.forEach (ele => {
            if (!process.env.ROLE_NEW.split(',').includes (ele.id)) return;
            rolesID.push (ele.id);
        })
        console.log (3)
        member.edit ({roles: rolesID});
        console.log (4)
    }
    else member.edit ({roles: userInfo.roleID});
    const timestamp = new Date();
    const startedChannel = guild.channels.find (ele => ele.parentID == process.env.CHANNEL_P_STARTED && ele.name.charAt(0) == '╙');
    const pastTenseJoin = (userInfo) ? 'Returned' : 'Joined';
    let welcomeEmbed = createEmbed ((userInfo) ? 'white' : 'blue', timestamp, 'Member - ' + pastTenseJoin, 'Welcome ' + ((userInfo) ? 'back ' : '') + member.mention + '. Approve yourself into this server ' + ((userInfo) ? 'again ': '') + 'by reading ' + startedChannel.mention + '.')
    welcomeEmbed.author = {
        name: member.username,
        icon_url: member.staticAvatarURL,
        url: 'https://discordapp.com/users/' + member.id
    }
    welcomeEmbed.image = {url: 'attachment://image.png'};
    let welcomeImage = await welcomeGraphic (member)
    welcomeChannel.createMessage ({content: member.mention + ',', embed: welcomeEmbed}, {file: welcomeImage.toBuffer(), name: 'image.png'});
    let embed = createEmbed ('blue', timestamp, 'Member - ' + pastTenseJoin, 'A guild member ' + pastTenseJoin.toLowerCase() + ': **' + member.user.username + '**\n🧝 \`Target\`| 🕵️ \`Inviter\`| ✉️ \`Invite\`|')
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['🧝', '🕵️', '✉️']);
    const filter = (mes, emj, usr) => (emj.name == '🧝' || emj.name == '🕵️' || emj.name == '✉️') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let usedInvite; let count; let countTarget; let countInvite; let countInviter; embed.fields = []
    collector.on('collect', async (Message2nd, emoji, userID) => {
        if ((emoji.name == '🕵️' || emoji.name == '✉️') && !count) {
            const cachedInvites = guildInvites.get (guild.id);
            let newInvites = await guild.getInvites()
            guildInvites.set(guild.id, newInvites);
            usedInvite = newInvites.find (inv => inv.uses > cachedInvites.find (invC => inv.code == invC.code).uses)
            count = 1
        }
        if (emoji.name == '🧝' && !countTarget) {
            sentMessage.removeMessageReactionEmoji ('🧝');
            embed = embedPushTarget (embed, member, guild.memberCount)
            sentMessage.edit ({embed: embed});
            countTarget = 1
        }
        else if (emoji.name == '🕵️' && !countInviter) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            if (!usedInvite) embed.fields.push ({name: 'Executor:', value: 'The executor cannot be obtained', inline: false});  
            else {
                embed = embedPushExecutor (embed, usedInvite.inviter, guild)
            }
            sentMessage.edit ({embed: embed});
            countInviter = 1
        }
        else if (emoji.name == '✉️' && !countInvite) {
            sentMessage.removeMessageReactionEmoji ('✉️');
            if (!usedInvite) embed.fields.push ({name: 'Invite:', value: 'Invite link can not be obtained', inline: false})
            else {
                embed = embedPushInvite (embed, usedInvite, timestamp);
            }
            sentMessage.edit ({embed: embed});
            countInvite = 1;
        }
        if (countTarget && countInviter && countInvite) collector.stop ()
    });
    collector.on ('end', () => sentMessage.removeReactions());
})

client.on ('guildMemberUpdate', async (guild, member, oldMember) => {
    if (oldMember.roles != member.roles) {
        let userInfo = await getUserInfo (member, guild);
        userInfo.roleID = member.roles;
        await timeout (50);
        userInfo.save();
    }
    if (oldMember.nick == member.nick) return;
    const timestamp = new Date();
    const memberNick = (oldMember.nick) ? ((oldMember.nick.length >= 32) ? oldMember.nick.substring(0, 31) + '...' : oldMember.nick) : member.username
    let embed = createEmbed ('white', timestamp, 'Member - Update', 'A member has been updated: **' + memberNick + '**\n🧝 `Target`|')
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['🧝']);
    if (member.nick && member.nick.match (/[`*_]/g)) member.edit ({nick: member.nick.replace (/[`*_]/g, '')})
    const filter = (mes, emj, usr) => (emj.name == '🧝') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countTarget; embed.fields = [];
    collector.on('collect', async (message2nd, emoji, userID) => {
        if (emoji.name == '🧝' && !countTarget) {
            sentMessage.removeMessageReactionEmoji ('🧝');
            embed = embedPushTarget (embed, member, findPosition (member, guild, false));
            sentMessage.edit ({embed: embed});
            countTarget = 1;
            collector.stop ()
        }
    });
    return collector.on('end', collected => sentMessage.removeReactions())  
})

client.on ('guildMemberRemove', async (guild, member) => {
    const timestamp = new Date();
    await timeout (1000);
    let audit = await getAudit (member.guild, member, 20, timestamp);
    if (!audit) audit = await getAudit (member.guild, member, 22, timestamp)
    let title; let descriptionMessage; let descriptionLog; let embedField;
    if (!audit) {
        title = 'Member - Left';
        descriptionMessage = 'Farewell ' + member.mention + ', we hope you come back another time.';
        descriptionLog = 'A guild member left: **' + member.username + '**\n🧝 \`Target\`|';
    }
    else {
        const pastVerb = (audit.actionType == 20) ? 'Kicked': 'Banned';
        title = 'Member - ' + pastVerb
        descriptionMessage = 'Farewell ' + member.mention + ', they have been ' + pastVerb.toLowerCase() + ' by ' + audit.user.mention + '.';
        descriptionLog = 'A guild member got ' + pastVerb.toLowerCase() + ': **' + member.username + '**\n🧝 \`Target\`| 🕵️ \`Executor\`| ⚖️ \`Reason\`';
        embedField = true;
    }
    let embed = createEmbed ('orange', timestamp, title, descriptionLog)
    let leaveEmbed = createEmbed ('orange', timestamp, title, descriptionMessage)
    leaveEmbed.image = {url: 'attachment://image.png'};
    let leavingImage = await leavingGraphic (member)
    leaveEmbed.author = {
        name: member.username,
        icon_url: member.staticAvatarURL,
        url: 'https://discordapp.com/users/' + member.id
    };
    if (embedField) leaveEmbed.fields = [{name: ((audit.actionType == 20) ? 'Kick': 'Ban') + ' Reason:', value: textLimiter ('>>> ', audit.reason, '', 'No apparent reason'), inline: false}]
    welcomeChannel.createMessage ({content: member.mention + ',', embed: leaveEmbed}, {file: leavingImage.toBuffer(), name: 'image.png'});
    const sentMessage = await logChannel.createMessage ({embed: embed});
    sentMessage.addReaction ('🧝');
    if (audit) reactMultiple (sentMessage, ['🕵️', '⚖️']);
    const filter = (mes, emj, usr) => (emj.name == '🧝' || ((emj.name == '🕵️' || emj.name == '⚖️') && audit)) && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countTarget; let countExecutor; let countReason; embed.fields = [];
    collector.on('collect', async (Message2nd, emoji, userID) => {
        if (emoji.name == '🧝' && !countTarget) {
            sentMessage.removeMessageReactionEmoji ('🧝');
            embed = embedPushTarget (embed, member, findPosition (member, guild, true))
            sentMessage.edit ({embed: embed});
            countTarget = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor && audit) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            embed = embedPushExecutor (embed, audit.user, guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        else if (emoji.name == '⚖️' && !countReason && audit) {
            sentMessage.removeMessageReactionEmoji ('⚖️');
            embed = embedPushReason (embed, audit)
            sentMessage.edit ({embed: embed});
            countReason = 1
        }
        if (countTarget && (!audit || (audit && countExecutor && countReason))) collector.stop ();
    })
    return collector.on('end', collected => sentMessage.removeReactions())
})

client.on ('guildBanRemove', async (guild, user) => {
    const timestamp = new Date();
    let embed = createEmbed ('white', timestamp, 'Member - Unban', 'A user has been unbanned: **' + user.username + '**\n🧝 \`Target\`| 🕵️ \`Executor\`| ⚖️ \`Reason\`')
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['🧝', '🕵️', '⚖️']);
    const filter = (mes, emj, usr) => (emj.name == '🧝' || emj.name == '🕵️' || emj.name == '⚖️') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countTarget; let countExecutor; let countReason; let countAudit; let audit; embed.fields = []
    collector.on('collect', async (Message2nd, emoji, userID) => {
        if ((emoji.name == '🕵️' || emoji.name == '⚖️') && !countAudit) audit = await getAudit (guild, user, 23, timestamp);
        if (emoji.name == '🧝' && !countTarget) {
            sentMessage.removeMessageReactionEmoji ('🧝');
            embed = embedPushTarget (embed, user, findPosition (user, guild, true))
            sentMessage.edit ({embed: embed});
            countTarget = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            embed = embedPushExecutor (embed, audit.user, guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        else if (emoji.name == '⚖️' && !countReason) {
            sentMessage.removeMessageReactionEmoji ('⚖️');
            embed = embedPushReason (embed, audit)
            sentMessage.edit ({embed: embed});
            countReason = 1;
        }
        if (countExecutor && countTarget && countReason) collector.stop();
    });
    return collector.on('end', collected => sentMessage.removeReactions());
})

// Channels
client.on ('channelCreate', async channel => {
    if (!channel.guild) return
    const timestamp = new Date();
    let channelName = channel.name.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    if (channelName.length >= 32) channelName = channelName.substring(0, 31) + '...';
    let embed = createEmbed ('blue', timestamp, 'Channel - Create', 'A channel has been created: **' + channelName + '**\n📖 \`Channel\`| 🕵️ \`Executor\`|');
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['📖', '🕵️']);
    const filter = (mes, emj, usr) => (emj.name == '📖' || emj.name == '🕵️') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countChannel; let countExecutor; embed.fields = [];
    collector.on('collect', async (Message2nd, emoji, userID) => {
        if (emoji.name == '📖' && !countChannel) {
            sentMessage.removeMessageReactionEmoji ('📖');
            embed = embedPushChannel (embed, channel);
            sentMessage.edit ({embed: embed});
            countChannel = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            let audit = await getAudit (channel.guild, channel, 10, timestamp);
            embed = embedPushExecutor (embed, audit.user, channel.guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        if (countExecutor && countChannel) collector.stop ()
    });
    return collector.on('end', collected => sentMessage.removeReactions())
})

let cooldownChannelUpdate = false;
client.on ('channelUpdate', async (channel, oldChannel) => {
    if (!channel.guild || channel.position != oldChannel.position || channel.permissionoverwrites != oldChannel.permissionoverwrites || cooldownChannelUpdate == true) return;
    cooldownChannelUpdate = true;
    setTimeout(() => {
        cooldownChannelUpdate = false;
    }, 5000);
    const timestamp = new Date();
    let channelName = oldChannel.name.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    if (channelName.length >= 32) channelName = channelName.substring(0, 31) + '...'
    let embed = createEmbed ('white', timestamp, 'channel - update', 'a channel has been updated: **' + channelName + '**\n📖 \`channel\`| 🕵️ \`executor\`| 📸 \`changes\`|')
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['📖', '🕵️', '📸']);
    const filter = (mes, emj, usr) => (emj.name == '📖' || emj.name == '🕵️' || emj.name == '📸') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countChannel; let countExecutor; let countChanges; let countaudit; let audit; embed.fields = [];
    collector.on('collect', async (message2nd, emoji) => {
        if ((emoji.name == '🕵️' || emoji.name == '📸') && !countaudit) {
            audit = await getAudit (channel.guild, channel, 11, timestamp);
            if (!audit) audit = await getAudit (channel.guild, channel, 13, timestamp);
            if (!audit) audit = await getAudit (channel.guild, channel, 14, timestamp);
            if (!audit) audit = await getAudit (channel.guild, channel, 15, timestamp);
        }
        if (emoji.name == '📖' && !countChannel) {
            sentMessage.removeMessageReactionEmoji ('📖');
            embed = embedPushChannel (embed, channel);
            sentMessage.edit ({embed: embed});
            countChannel = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            embed = embedPushExecutor (embed, audit.user, channel.guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        else if (emoji.name == '📸' && !countChanges) {
            sentMessage.removeMessageReactionEmoji ('📸');
            embed = embedPushChanges (embed, audit)
            sentMessage.edit ({embed: embed});
            countChanges = 1;
        }
        if (countExecutor && countChannel && countChanges) collector.stop ()
    });
    return collector.on('end', collected => sentMessage.removeReactions())
})

client.on ('channelDelete', async channel => {
    if (!channel.guild) return
    const timestamp = new Date();
    let channelName = channel.name.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())
    let embed = createEmbed ('orange', timestamp, 'Channel - Delete', 'A channel has been deleted: **' + channelName + '**\n📖 \`Channel\`| 🕵️ \`Executor\`|');
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['📖', '🕵️'])
    const filter = (mes, emj, usr) => (emj.name == '📖' || emj.name == '🕵️') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countChannel; let countExecutor; embed.fields = [];
    collector.on('collect', async (Message2nd, emoji, userID) => {
        if (emoji.name == '📖' && !countChannel) {
            sentMessage.removeMessageReactionEmoji ('📖');
            embed = embedPushChannel (embed, channel);
            sentMessage.edit ({embed: embed});
            countChannel = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            let audit = await getAudit (channel.guild, channel, 12, timestamp);
            embed = embedPushExecutor (embed, audit.user, channel.guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        if (countExecutor && countChannel) collector.stop ()
    });
    return collector.on('end', collected => sentMessage.removeReactions())
})

// Messages
client.on ('messageUpdate', async (message, oldMessage) => {
    if (!message.channel.guild || (message.author && message.author.bot) || message.content == message.oldMessage) return;
    const timestamp = new Date();
    if (!message.content) {
        let embed = createEmbed ('white', timestamp, 'Partial - Update', 'A message partial has been deleted: **' + message.id + '**\n📖 \`Channel\`|')
        const sentMessage = await logChannel.createMessage ({embed: embed})
        sentMessage.addReaction ('📖')
        const filter = (mes, emj, usr) => (emj.name == '📖') && usr != client.user.id;
        const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
        let countChannel; embed.fields = [];
        collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
            if (emoji.name == '📖' && !countChannel) {
                sentMessage.removeMessageReactionEmoji ('📖');
                embed = embedPushChannel (embed, message.channel);
                sentMessage.edit ({embed: embed});
                countChannel = 1;
            }
        })
        collector.on ('end', () => sentMessage.removeReactions());
    }
    else {
        if (!oldMessage) oldMessage = message;
        let embed = createEmbed ('white', timestamp, 'Message - Update', 'A message has been updated: **' + textLimiter('', oldMessage.content, '', 'Not available in text.', 32) + '**\n📄 \`Message\`| 🗞️ \`Content\`| 🕵️ \`Executor\`|')
        const sentMessage = await logChannel.createMessage ({embed});
        reactMultiple (sentMessage, ['📄', '🗞️', '🕵️']);
        const filter = (mes, emj, usr) => (emj.name == '📄' || emj.name == '🗞️' || emj.name == '🕵️') && usr != client.user.id;
        const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
        let countMessage; let countExecutor; let countContent; embed.fields = [];
        collector.on ('collect', async (sentMessage, emoji, userID) => {
            if (emoji.name == '📄' && !countMessage) {
                sentMessage.removeMessageReactionEmoji ('📄');
                embed = embedPushMessage (embed, message);
                sentMessage.edit ({embed});
                countMessage = 1;
            }
            else if (emoji.name == '🗞️' && !countContent) {
                sentMessage.removeMessageReactionEmoji ('🗞️');
                embed = embedPushContent (embed, oldMessage.content);
                sentMessage.edit ({embed});
                countContent = 1;
            }
            else if (emoji.name == '🕵️' && !countExecutor) {
                sentMessage.removeMessageReactionEmoji ('🕵️');
                embed = embedPushExecutor (embed, message.member, message.channel.guild);
                sentMessage.edit ({embed});
                countExecutor = 1;
            };
            if (countMessage && countContent && countExecutor) collector.stop ();
        });
        collector.on ('end', () => sentMessage.removeReactions());
    }
})

client.on ('messageDelete', async message => {
    if (!message.channel.guild || (message.author && message.author.bot)) return;
    const timestamp = new Date();
    if (!message.member) {
        let embed = createEmbed ('orange', timestamp, 'Partial - Delete', 'A message partial has been deleted: **' + message.id + '**\n📖 \`Channel\`|')
        const sentMessage = await logChannel.createMessage ({embed: embed})
        sentMessage.addReaction ('📖')
        const filter = (mes, emj, usr) => (emj.name == '📖') && usr != client.user.id;
        const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
        let countChannel; embed.fields = [];
        collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
            if (emoji.name == '📖' && !countChannel) {
                sentMessage.removeMessageReactionEmoji ('📖');
                embed = embedPushChannel (embed, message.channel);
                sentMessage.edit ({embed: embed});
                countChannel = 1;
            }
        })
        collector.on ('end', () => sentMessage.removeReactions());
    }
    else {
        let attachment;
        let embed = createEmbed ('orange', timestamp, 'Message - Delete', 'A message has been deleted: **' + textLimiter ('', message.cleanContent, '', 'Not available in text.', 32) + '**\n📄 \`Message\`| 🗞️ \`Content\`| 🕵️ \`Executor\`|')
        try {
            if (message.attachments.length > 0) {
                let firstAttachment = message.attachments[0];
                attachment = await getAttachment (firstAttachment);
                embed.image = {url: 'attachment://image.png'}
            }
        }
        catch {};
        const sentMessage = await logChannel.createMessage ({embed: embed}, (attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null);
        reactMultiple (sentMessage, ['📄', '🗞️', '🕵️']);
        const filter = (mes, emj, usr) => (emj.name == '📄' || emj.name == '🗞️' || emj.name == '🕵️') && usr != client.user.id;
        const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
        let countMessage; let countExecutor; let countContent; embed.fields = [];
        collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
            if (emoji.name == '📄' && !countMessage) {
                sentMessage.removeMessageReactionEmoji ('📄');
                embed = embedPushMessage (embed, message);
                sentMessage.edit ({embed});
                countMessage = 1;
            }
            else if (emoji.name == '🗞️' && !countContent) {
                sentMessage.removeMessageReactionEmoji ('🗞️');
                embed = embedPushContent (embed, message.content);
                sentMessage.edit ({embed});
                countContent = 1;
            }
            else if (emoji.name == '🕵️' && !countExecutor) {
                sentMessage.removeMessageReactionEmoji ('🕵️');
                embed = embedPushExecutor (embed, message.member, message.channel.guild)
                sentMessage.edit ({embed});
                countExecutor = 1;
            };
            if (countMessage && countContent && countExecutor) collector.stop ();
        });
        collector.on ('end', () => sentMessage.removeReactions());
    }
})

// Emojis
client.on ('guildEmojisUpdate', async (guild, emojis, oldEmojis) => {
    const timestamp = new Date();
    if (emojis.length != oldEmojis.length) {
        let action = (emojis.length > oldEmojis.length) ? 'Create' : 'Delete';
        let emoji = (emojis.length > oldEmojis.length) ? emojis.filter(ele => !oldEmojis.includes(ele)).shift() : oldEmojis.filter(ele => !emojis.includes(ele)).shift();
        let embed = createEmbed ((emojis.length > oldEmojis.length) ? 'blue' : 'orange', timestamp, 'Emoji - ' + action, 'An emoji has been ' + action.toLowerCase() + 'd: **<' + ((emoji.animated) ? 'a' : '') + ':' + emoji.name + ':' + emoji.id + '>**\n🎨 \`Emoji\`| 🕵️ \`Executor\`|');
        const sentMessage = await logChannel.createMessage ({embed: embed});
        reactMultiple (sentMessage, ['🎨', '🕵️'])
        const filter = (mes, emj, usr) => (emj.name == '🎨' || emj.name == '🕵️') && usr != client.user.id;
        const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
        let countEmoji; let countExecutor; embed.fields = [];
        collector.on ('collect', async (messageReaction, emojiReaction, userID) => {
            if (emojiReaction.name == '🎨' && !countEmoji) {
                sentMessage.removeMessageReactionEmoji ('🎨');
                embed = embedPushEmoji (embed, emoji);
                sentMessage.edit ({embed: embed});
                countEmoji = 1;
            }
            else if (emojiReaction.name == '🕵️' && !countExecutor) {
                sentMessage.removeMessageReactionEmoji ('🕵️');
                let audit = await getAudit (guild, emoji, (emojis.length > oldEmojis.length) ? 60 : 62, timestamp);
                embed = embedPushExecutor (embed, audit.user, guild)
                sentMessage.edit ({embed: embed});
                countExecutor = 1;
            }
            if (countEmoji && countExecutor) collector.stop ();
        });
        collector.on ('end', () => sentMessage.removeReactions());
    }
    else {
        let oldEmojisMap = oldEmojis.map (ele => ele.name);
        let emoji = emojis.find (ele => !oldEmojisMap.includes (ele.name))
        let embed = createEmbed ('white', timestamp, 'Emoji - update', 'An emoji has been updated: **<' + ((emoji.animated) ? 'a' : '') + ':' + emoji.name + ':' + emoji.id + '>**\n🎨 \`Emoji\`| 🕵️ \`Executor\`| 📸 \`Changes\`|');
        const sentMessage = await logChannel.createMessage ({embed: embed});
        reactMultiple (sentMessage, ['🎨', '🕵️', '📸'])
        const filter = (mes, emj, usr) => (emj.name == '🎨' || emj.name == '🕵️' || emj.name == '📸') && usr != client.user.id;
        const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
        let countEmoji; let countExecutor; let countChanges; let audit; embed.fields = [];
        collector.on ('collect', async (messageReaction, emojiReaction, userID) => {
            if (emojiReaction.name == '🕵️' || emojiReaction.name == '📸') audit = await getAudit (guild, emoji, 61, timestamp)
            if (emojiReaction.name == '🎨' && !countEmoji) {
                sentMessage.removeMessageReactionEmoji ('🎨');
                embed = embedPushEmoji (embed, emoji);
                sentMessage.edit ({embed: embed});
                countEmoji = 1;
            }
            else if (emojiReaction.name == '🕵️' && !countExecutor) {
                sentMessage.removeMessageReactionEmoji ('🕵️');
                embed = embedPushExecutor (embed, audit.user, guild)
                sentMessage.edit ({embed: embed});
                countExecutor = 1;
            }
            else if (emojiReaction.name == '📸' && !countChanges) {
                sentMessage.removeMessageReactionEmoji ('📸');
                embed = embedPushChanges (embed, audit)
                sentMessage.edit ({embed: embed});
                countChanges = 1;
            }
            if (countEmoji && countExecutor && countChanges) collector.stop ();
        });
        collector.on ('end', () => sentMessage.removeReactions());
    }
})

// Guilds
client.on ('guildUpdate', async (guild, oldGuild) => {
    const timestamp = new Date();
    let attachment;
    let embed = createEmbed ('white', timestamp, 'Guild - Update', 'The guild has been updated: **' + (oldGuild.name.length >= 32) ? oldGuild.name.substring(0, 31) + '...' : oldGuild.name + '**\n🗃️ \`Guild\`| 🕵️ \`Executor\`| 📸 \`Changes\`|')
    try {
        if (guild.icon != oldGuild.icon) {
            let imageURL = 'https://cdn.discordapp.com/icons/' + guild.id + '/' + oldGuild.icon + '.webp?size=512';
            let attachmentObject = {
                width: 270,
                height: 270,
                proxy_url: imageURL
            };
            attachment = await getAttachment (attachmentObject);
            embed.image = {url: 'attachment://image.png'}
        }
    }
    catch {};
    const sentMessage = await logChannel.createMessage ((!attachment) ? ({embed}) : ({embed}, {file: attachment.toBuffer(), name: 'image.png'}));
    reactMultiple (sentMessage, ['🗃️', '🕵️', '📸']);
    const filter = (mes, emj, usr) => (emj.name == '🗃️' || emj.name == '🕵️' || emj.name == '📸') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countChannel; let countExecutor; let countChanges; let countAudit; let audit; embed.fields = [];
    collector.on('collect', async (message2nd, emoji, userID) => {
        if ((emoji.name == '🕵️' || emoji.name == '📸') && !countAudit) audit = await getAudit (guild, guild, 1, timestamp);
        if (emoji.name == '🗃️' && !countChannel) {
            sentMessage.removeMessageReactionEmoji ('🗃️');
            embed = embedPushGuild (embed, guild, oldGuild);
            sentMessage.edit ({embed: embed});
            countChannel = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            embed = embedPushExecutor (embed, audit.user, guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        else if (emoji.name == '📸' && !countChanges) {
            sentMessage.removeMessageReactionEmoji ('📸');
            embed = embedPushChanges (embed, audit)
            sentMessage.edit ({embed: embed});
            countChanges = 1;
        }
        if (countExecutor && countChannel && countChanges) collector.stop ()
    });
    return collector.on('end', collected => sentMessage.removeReactions())
})

// Roles
client.on ('guildRoleCreate', async (guild, role) => {
    const timestamp = new Date();
    let embed = createEmbed ('blue', timestamp, 'Role - Create', 'A role has been created: **' + role.name + '**\n👑 \`Role\`| 🕵️ \`Executor\`|');
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['👑', '🕵️']);
    const filter = (mes, emj, usr) => (emj.name == '👑' || emj.name == '🕵️') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countRole; let countExecutor; embed.fields = [];
    collector.on('collect', async (Message2nd, emoji, userID) => {
        if (emoji.name == '👑' && !countRole) {
            sentMessage.removeMessageReactionEmoji ('👑');
            embed = embedPushRole (embed, role);
            sentMessage.edit ({embed: embed});
            countRole = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            let audit = await getAudit (guild, role, 30, timestamp);
            embed = embedPushExecutor (embed, audit.user, guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        if (countExecutor && countRole) collector.stop ()
    });
    return collector.on('end', collected => sentMessage.removeReactions())
})

client.on ('guildRoleUpdate', async (guild, role, oldRole) => {
    if (role.name == oldRole.name && role.permissions.allow == oldRole.permissions.allow && role.color == oldRole.color && role.mentionable == oldRole.mentionable && role.hoist == oldRole.hoist) return;
    const timestamp = new Date();
    let embed = createEmbed ('white', timestamp, 'Role - Update', 'A role has been updated: **' + oldRole.name + '**\n👑 \`Role\`| 🕵️ \`Executor\`| 📸 \`Changes\`|');
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['👑', '🕵️', '📸']);
    const filter = (mes, emj, usr) => (emj.name == '👑' || emj.name == '🕵️' || emj.name == '📸') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countRole; let countExecutor; let countChanges; let audit; embed.fields = [];
    collector.on('collect', async (Message2nd, emoji, userID) => {
        if ((emoji.name == '🕵️' || emoji.name == '📸') && !audit) audit = await getAudit (guild, role, 31, timestamp);
        if (emoji.name == '👑' && !countRole) {
            sentMessage.removeMessageReactionEmoji ('👑');
            embed = embedPushRole (embed, role);
            sentMessage.edit ({embed: embed});
            countRole = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            embed = embedPushExecutor (embed, audit.user, guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        else if (emoji.name == '📸' && !countChanges) {
            sentMessage.removeMessageReactionEmoji ('📸');
            embed = embedPushChanges (embed, audit)
            sentMessage.edit ({embed: embed});
            countChanges = 1;
        }
        if (countRole && countExecutor && countChanges) collector.stop ();
    });
    return collector.on('end', collected => sentMessage.removeReactions());
})

client.on ('guildRoleDelete', async (guild, role) => {
    const timestamp = new Date();
    let embed = createEmbed ('orange', timestamp, 'Role - Delete', 'A role has been deleted: **' + role.name + '**\n👑 \`Role\`| 🕵️ \`Executor\`|');
    const sentMessage = await logChannel.createMessage ({embed: embed});
    reactMultiple (sentMessage, ['👑', '🕵️']);
    const filter = (mes, emj, usr) => (emj.name == '👑' || emj.name == '🕵️') && usr != client.user.id;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
    let countRole; let countExecutor; embed.fields = [];
    collector.on('collect', async (Message2nd, emoji, userID) => {
        if (emoji.name == '👑' && !countRole) {
            sentMessage.removeMessageReactionEmoji ('👑');
            embed = embedPushRole (embed, role);
            sentMessage.edit ({embed: embed});
            countRole = 1;
        }
        else if (emoji.name == '🕵️' && !countExecutor) {
            sentMessage.removeMessageReactionEmoji ('🕵️');
            let audit = await getAudit (guild, role, 32, timestamp);
            embed = embedPushExecutor (embed, audit.user, guild)
            sentMessage.edit ({embed: embed});
            countExecutor = 1;
        }
        if (countExecutor && countRole) collector.stop ()
    });
    return collector.on('end', collected => sentMessage.removeReactions())
})

// Misc
const usersMap = new Map(); const statesMap = new Map();
client.on ('messageCreate', async message => {
    if (!message.channel.guild || message.author.bot) return;
    let messageCategory = message.channel.guild.channels.find (ele => ele.id == message.channel.parentID);
    if (!messageCategory) return;
    if(usersMap.has (message.author.id)) {
        let userData = usersMap.get (message.author.id);
        const difference = Date.now() - userData.lastMessage.timestamp;
        if (difference > config.discordInfo.constants.autoModDif) {
            clearTimeout(userData.timer);
            userData.msgCount = 1;
            userData.lastMessage = message;
            userData.timer = setTimeout(() => {
                usersMap.delete(message.member.id);
            }, config.discordInfo.constants.autoModTim);
            usersMap.set(message.member.id, userData);
        }
        else {
            userData.msgCount = userData.msgCount + 1;
            if(parseInt(userData.msgCount) == config.discordInfo.constants.autoModLim) {
                const role = message.channel.guild.roles.find (ele => ele.id == process.env.ROLE_MUTE);
                message.member.addRole(role.id);
                let embed = createEmbed ('orange', new Date, 'Security - Spam', message.member.mention + ' is temporarily muted preemptively for spamming.');
                let sentMessage = await message.channel.createMessage({embed: embed});
                let userInfo = await getUserInfo (message.member, guild);
                if (!userInfo) return
                if (userInfo.money <= 5) userInfo.money -= 5;
                else userInfo.money = 5
                userInfo.save();
                setTimeout(() => {
                    message.member.removeRole(role.id);
                    embed.color = randomColor ('blue')
                    embed.description = message.member.mention + ' is no longer muted for spamming.'
                    sentMessage.edit({embed: embed});
                }, config.discordInfo.constants.autoModTim);
            }
            else {
                usersMap.set(message.member.id, userData);
            }
        }
    }
    else {
        if (!config.discordInfo.prefix.includes (message.content.charAt(0)) && !message.content.replace('!', '').startsWith(client.user.mention)) {
            let userInfo = await getUserInfo (message.member, guild);
            if (!userInfo || !userInfo.money) return;
            userInfo.money = userInfo.money + 1;
            userInfo.save();
        }
        let fn = setTimeout(() => {
            usersMap.delete(message.author.id);
        }, config.discordInfo.constants.autoModTim);
        usersMap.set(message.author.id, {
            msgCount: 1,
            lastMessage: message,
            timer: fn
        });
    }
    if (message.channel.parent !== null && Object.keys(config.places).find (ele => config.places[ele].name.toLowerCase() == messageCategory.name) && (!config.discordInfo.prefix.includes (message.content.charAt(0)) && !message.content.replace('!', '').startsWith(client.user.mention))) {
        let embed = {
            timestamp: new Date().toISOString(),
            color: randomColor ('all'),
            author: {
                name: (message.member.nick || message.member.name), 
                icon_url: message.member.staticAvatarUR, 
                url: 'https://discordapp.com/users/' + message.member.id
            },
            fields: [{name: 'Message:', value: textLimiter ('>>> ', message.content.replace( /[\r\n]+/gm,' '), '', '-This message is not available in text.', 256), inline: false}]
        };
        let attachment;
        try {
            if (message.attachments.length > 0) {
                let firstAttachment = message.attachments[0];
                attachment = await getAttachment (firstAttachment);
                embed.image = {url: 'attachment://image.png'};
            };
        }
        catch {};
        if (message.content.length >= 192 || (message.content.length >= 96 && message.attachments.size > 0)) {
            embed.fields.push (
                {name: 'Author:', value: '[' + message.member.nick || message.member.username + '](https://discordapp.com/users/' + message.member.id + ')`', inline: true},
                {name: 'Attachments:', value: (message.attachments.size > 0) ? (message.attachments.size + 'attachment' + (message.attachments.size == 1 ? '' : 's')) : 'No attachments', inline: true},
                {name: 'URL:', value: '[Message Hyperlink](https://discordapp.com/channels/' + message.guildID + '/' + message.channel.id + '/' + message.id + ')', inline: true}
            );
        };
        let channelm = messageCategory.name.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        let state = statesMap.get (message.channel.id);
        if (!statesMap.has (message.channel.id)) {
            let roleID = guild.roles.find(ele => ele.name.toLowerCase() == messageCategory.name.toLowerCase()).id
            let people = guild.members.filter (mem => mem.roles.includes(roleID)).length || 1;
            let allMessages = await message.channel.getMessages(50);
            let messages = allMessages.filter (msg => (msg.timestamp >= message.timestamp - 3600000) && !msg.author.bot);
            state = {people: people, messages: messages.length}
            statesMap.set (message.channel.id, state)
            setTimeout (() => {
                statesMap.delete(message.channel.id);
            }, 900000)
        }
        else statesMap.set (message.channel.id, {people: state.people, messages: state.messages + 1})
        const inviteState = await message.channel.createInvite ({maxAge: 7200}, 'Automated');
        embed.fields.push (
            {name: 'State:', value: '[' + channelm + '](https://discord.gg/' + inviteState.code + ')', inline: true},
            {name: 'Activity:', value: ((state.messages >= 50) ? '50+' : state.messages) + ' messages', inline: true},
            {name: 'Population:', value: state.people, inline: true}
        );
        allStatesChannel.createMessage ({embed: embed}, (attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null);
    }
    else if (message.channel.parentID == process.env.CHANNEL_P_STARTED && message.channel.name.startsWith('╙')) {
        message.delete('Automated');
        if (!message.content.startsWith('-')) return;
        let state = message.content.toLowerCase().substring(1).replace(' ', '');
        let postalCode = Object.keys(config.places).find(key => config.places[key].alias.includes (state));
        if (!postalCode) return;
        let userInfo = await getUserInfo (message.member, message.channel.guild);
        userInfo.state = postalCode;
        await timeout (100);
        userInfo.save();
        let stateRole = guild.roles.find (ele => ele.name == config.places[postalCode].name);
        message.member.addRole (stateRole.id, 'Automated');
        message.member.removeRole (process.env.ROLE_NEWCOMER, 'Automated');
        let stateInfo = await getStateInfo (guild, postalCode);
        if (stateInfo.welcomeMessage) {
            let governor = guild.members.find (ele => ele.id == stateInfo.governorID);
            embed = {
                title: 'Travel - Arrival',
                description: stateInfo.welcomeMessage,
                timestamp: new Date().toISOString(),
                fields: [
                    {name: 'State:', value: placesConfig[postalCode].name, inline: true},
                    {name: 'From:', value: 'Somewhere else', inline: true},
                    {name: 'Governor:', value: governor.mention, inline: true}
                ]
            }
        }
    }
})

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

function findPosition (member, guild, push) {
    let sortedMembers = [];
    guild.members.forEach (ele => sortedMembers.push(ele));
    if (push == true) sortedMembers.push (member);
    sortedMembers.sort((a, b) => a - b);
    let joinPosition = 0;
    try {
        for (j = 0; j < sortedMembers.length; j++) {
            if (sortedMembers[j].id == member.id) return joinPosition = j + 1;
        }
    }
    catch {
        joinPosition = '??';
    }
    finally {
        return joinPosition;
    }
}

function textLimiter (pretext, text, suftext, notApplied, maxLimit) {
    if (text) {
        textResult = (pretext + text + suftext) || text;
        if (text && text.length >= (maxLimit || 64)) textResult = textResult.substring(0, (maxLimit || 63)).trim() + '...';
        textResult = textResult.replace( /[\r\n]+/gm," ")
        return textResult;
    }
    else return (notApplied || 'Not obtainable')
}

async function getAudit (guild, target, actionType, timestamp) {
    const fetchedLogs = await guild.getAuditLogs(5, null, actionType);
    const finalAudit = fetchedLogs.entries.sort((a, b) => a.createdTimestamp > b.createdTimestamp).filter(ele => ele.targetID == target.id).shift();
    if (!finalAudit) return;
    let binary = idToBinary (finalAudit.id)
    .toString(2)
    .padStart(64, '0');
    let discordTimestamp = parseInt(binary.substring(0, 42), 2) + 1420070400000
    let dateTimestamp = new Date(discordTimestamp)
    if (!finalAudit || dateTimestamp.getTime() <= timestamp.getTime() - 5000) return null;
    return finalAudit;
}

async function getAttachment (attachment) {
    const widthBoolean = (attachment.height * 3 <= attachment.width) ? true : false;
    let embedWidth = (widthBoolean == true) ? 870 : (attachment.width/attachment.height) * 270;
    let embedHeight = (widthBoolean == false) ? 270 : (attachment.height/attachment.width) * 870;
    const messageImage = canvas.createCanvas(900, embedHeight + 30);
    const ctx = messageImage.getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, 900, 0);
    gradient.addColorStop(0, '#2a2a2a');
    gradient.addColorStop(0.5, '#323232');
    gradient.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, embedHeight + 30)
    ctx.strokeStyle = '#e5e5e5';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 6;
    ctx.strokeRect (450 - (embedWidth / 2), 15, embedWidth, embedHeight); 
    const avatar = await canvas.loadImage (attachment.proxy_url);
    ctx.drawImage (avatar, 450 - (embedWidth / 2), 15, embedWidth, embedHeight);
    return messageImage;
}

function createEmbed (color, timestamp, title, description) {
    let embed = {
        title: title,
        description: description,
        color: randomColor (color),
        timestamp: timestamp.toISOString()
    };
    return embed;
}

function reactMultiple (message, reactions) {
    reactions.forEach (ele => message.addReaction (ele))
}

function highestRoleCalc (guild, memberID) {
    let guildMember = guild.members.find (ele => ele.id == memberID)
    let roleArray = []; guild.roles.forEach (ele => (guildMember.roles.includes (ele.id) ? roleArray.push (ele) : null))
    let topRole = roleArray.sort((a, b) => a.position - b.position).pop()
    return topRole;
}

function idToBinary (num) {
    let bin = '';
    let high = parseInt(num.slice(0, -10)) || 0;
    let low = parseInt(num.slice(-10));
    while (low > 0 || high > 0) {
      bin = String(low & 1) + bin;
      low = Math.floor(low / 2);
      if (high > 0) {
        low += 5000000000 * (high % 2);
        high = Math.floor(high / 2);
      }
    }
    return bin;
}

async function welcomeGraphic (member) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(0, 150, 900, 150);
    grd.addColorStop(0, '#ff9933');
    grd.addColorStop(1, '#cc6600');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.lineWidth = 5;
    ctx.beginPath();
    grd = ctx.createLinearGradient(290, 150, 885, 150);
    grd.addColorStop(0, '#004080');
    grd.addColorStop(1, '#003366');
    ctx.fillStyle = grd;
    let fontSize = 130;
    do ctx.font = 'bold ' + (fontSize -= 1) + 'px Verdana';
    while (ctx.measureText(member.username).width > 575);
    const textWidth = ctx.measureText(member.username).width;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.username, 300, 150);
    grd = ctx.createLinearGradient(0, 150, 900, 150);
    grd.addColorStop(0, '#ff9933');
    grd.addColorStop(1, '#cc6600');
    ctx.fillStyle = grd;
    if (80.5 < fontSize)
    {
        ctx.fillRect(0, 0, 900, 87)
        ctx.fillRect(0, 213, 900, 87)
    }
    else {
        ctx.fillRect(0, 0, 900, 118)
        ctx.fillRect(182, 0, 900, 118)
    }
    ctx.beginPath();
    for (let i = 0; 12 >= i; i++) {
        let yCoordinate = (Math.cos(i * Math.PI / 12) * 125) + 150
        ctx.moveTo ((Math.sin(i * Math.PI / 12) * 125) + 150, yCoordinate)
        if (5 <= i && i <= 7 && Math.abs(yCoordinate - 150) + 18 < fontSize) {
            ctx.lineTo (290, yCoordinate)
            ctx.moveTo (textWidth + 310, yCoordinate)
            ctx.lineTo (900, yCoordinate)
        }
        else ctx.lineTo (900, yCoordinate)
    }
    ctx.stroke();
    ctx.beginPath();
    grd = ctx.createLinearGradient(25, 150, 275, 150);
    grd.addColorStop(0, '#0059b3');
    grd.addColorStop(1, '#004080');
    ctx.fillStyle = grd;
    ctx.arc(150, 150, 125, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; 48 > i; i++) 
    {
        let multiply = 1;
        if (i % 2 == 1) multiply = 0.92;
        ctx.moveTo ((Math.sin(i * Math.PI / 24) * 100 * multiply) + 150, (Math.cos(i * Math.PI / 24) * 100 * multiply) + 150)
        ctx.lineTo ((Math.sin(i * Math.PI / 24) * 125 * multiply) + 150, (Math.cos(i * Math.PI / 24) * 125 * multiply) + 150)
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.arc(150, 150, 97.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.clip();
    const avatar = await canvas.loadImage (member.avatarURL);
    ctx.drawImage (avatar, 50, 50, 200, 200);
    return messageImage;
}

async function leavingGraphic (member) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(0, 150, 900, 150);
    grd.addColorStop(0, '#3399ff');
    grd.addColorStop(1, '#0066cc');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.lineWidth = 5;
    ctx.beginPath();
    grd = ctx.createLinearGradient(610, 150, 15, 150);
    grd.addColorStop(0, '#804000');
    grd.addColorStop(1, '#663300');
    ctx.fillStyle = grd;
    let fontSize = 130;
    do ctx.font = 'bold ' + (fontSize -= 1) + 'px Verdana';
    while (ctx.measureText(member.username).width > 575);
    const textWidth = ctx.measureText(member.username).width;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.username, 600, 150);
    grd = ctx.createLinearGradient(0, 150, 900, 150);
    grd.addColorStop(0, '#3399ff');
    grd.addColorStop(1, '#0066cc');
    ctx.fillStyle = grd;
    if (80.5 < fontSize)
    {
        ctx.fillRect(0, 0, 900, 87)
        ctx.fillRect(0, 213, 900, 87)
    }
    else {
        ctx.fillRect(0, 0, 900, 118)
        ctx.fillRect(182, 0, 900, 118)
    }
    ctx.beginPath();
    for (let i = 12; 24 >= i; i++) {
        let yCoordinate = (Math.cos(i * Math.PI / 12) * 125) + 150
        ctx.moveTo ((Math.sin(i * Math.PI / 12) * 125) + 750, yCoordinate)
        if (17 <= i && i <= 19 && Math.abs(yCoordinate - 150) + 18 < fontSize) {
            ctx.lineTo (610, yCoordinate)
            ctx.moveTo (590 - textWidth, yCoordinate)
            ctx.lineTo (0, yCoordinate)
        }
        else ctx.lineTo (0, yCoordinate)
    }
    ctx.stroke();
    ctx.beginPath();
    grd = ctx.createLinearGradient(875, 150, 625, 150);
    grd.addColorStop(0, '#b35900');
    grd.addColorStop(1, '#804000');
    ctx.fillStyle = grd;
    ctx.arc(750, 150, 125, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; 48 > i; i++) 
    {
        let multiply = 1;
        if (i % 2 == 1) multiply = 0.92;
        ctx.moveTo ((Math.sin(i * Math.PI / 24) * 100 * multiply) + 750, (Math.cos(i * Math.PI / 24) * 100 * multiply) + 150)
        ctx.lineTo ((Math.sin(i * Math.PI / 24) * 125 * multiply) + 750, (Math.cos(i * Math.PI / 24) * 125 * multiply) + 150)
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.arc(750, 150, 97.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.clip();
    const avatar = await canvas.loadImage (member.avatarURL);
    ctx.drawImage (avatar, 650, 50, 200, 200);
    return messageImage;
}

function embedPushChannel (embed, channel) {
    let channelType = Object.keys(config.discordInfo.channelTypes).find (ele => config.discordInfo.channelTypes[ele] == channel.type);
    embed.fields.push (
        {name: 'Channel:', value: channel.mention, inline: true},
        {name: 'Channel ID:', value: `[${channel.id}](https://discordapp.com/channels/${channel.guild.id}/${channel.id})`, inline: true},
        {name: 'Channel Type:', value: channelType, inline: true}
    );
    return embed;
}

function embedPushExecutor (embed, executor, guild) {
    try {
        let highestRole = highestRoleCalc (guild, executor.id);
        embed.fields.push (
            {name: 'Executor:', value: executor.mention, inline: true},
            {name: 'Executor ID:', value: `[${executor.id}](https://discordapp.com/users/${executor.id})`, inline: true},
            {name: 'Executor Role:', value: highestRole.mention, inline: true},
        );
    }
    catch {embed.fields.push ({name: 'Executor:', value: 'There was an error obtaining the executor', inline: true})}
    return embed;
}

function embedPushTarget (embed, target, joinOrder) {
    embed.fields.push (
        {name: 'Target:', value: target.mention, inline: true},
        {name: 'Target ID:', value: `[${target.id}](https://discordapp.com/users/${target.id})`, inline: true},
        {name: 'Target Order:', value: joinOrder, inline: true}
    );
    return embed;
}

function embedPushReason (embed, audit) {
    try {embed.fields.push ({name: 'Reason:', value: textLimiter ('', audit.reason, '', 'No apparent reason', 128), inline: false});}
    catch {embed.fields.push ({name: 'Reason:', value: 'There was an error obtaining the reason', inline: true})}
    return embed;
}

function embedPushInvite (embed, invite, timestamp) {
    const differenceTime = Date.parse(timestamp) - Date.parse(invite.createdAt);
    const differenceDay = differenceTime / 86400000;
    embed.fields.push (
        {name: 'Invite:', value: `[${invite.code}](https://discord.gg/${invite.code})`, inline: true},
        {name: 'Invite Age:', value: differenceDay.toFixed (2) + ' days', inline: true},
        {name: 'Invite Usage:', value: invite.uses, inline: true}
    );
    return embed;
}

function embedPushChanges (embed, audit) {
    try {
        Object.keys(audit.before).forEach (ele => audit.before[ele] = (audit.before[ele].length >= 48) ? audit.before[ele].substring(0, 47) + '...' : audit.before[ele])
        let changeToString = JSON.stringify(audit.before);
        let changeString = changeToString.replace(/[{}"]/g, '').replace(/:/g, ': `').replace (/,/g, '`\n').replace(/_/g, ' ').replace(/\b\w/g, ele => ele.toUpperCase()) + '`'
        changeString.replace (/``/g, '`[EMPTY]`')
        embed.fields.push ({name: 'Changes:', value: changeString, inline: false});
    }
    catch {embed.fields.push ({name: 'Changes:', value: 'There was an error obtaining the changes', inline: false})}
    return embed;
}

function embedPushMessage (embed, message) {
    embed.fields.push (
        {name: 'Message:', value: `[${message.id}](https://discordapp.com/channels/${message.guildID}/${message.channel.id}/${message.id})`, inline: true},
        {name: 'Message Channel:', value: message.channel.mention, inline: true},
        {name: 'Message Attachment:', value: (message.attachments.length > 0) ? `${message.attachments.length} attachment${(message.attachments.length == 1) ? '' : 's'}` : 'No attachments', inline: true}
    )
    return embed;
}

function embedPushContent (embed, content) {
    embed.fields.push (
        {name: 'Content:', value: textLimiter ('', content, '', 'This message is not available in text.', 256), inline: false},
    );
    return embed;
}

function embedPushEmoji (embed, emoji) {
    embed.fields.push (
        {name: 'Emoji:', value: `<${(emoji.animated) ? 'a' : ''}:${emoji.name}:${emoji.id}>`, inline: true},
        {name: 'Emoji Name:', value: emoji.name, inline: true},
        {name: 'Emoji ID:', value: `[${emoji.id}](https://cdn.discordapp.com/emojis/${emoji.id}.png)`, inline: true}
    )
    return embed;
}

function embedPushGuild (embed, guild, oldGuild) {
    embed.fields.push (
        {name: 'Guild:', value: oldGuild.name || guild.name, inline: true},
        {name: 'Guild ID:', value: `[${guild.id}](https://discord.com/channels/${guild.id})`, inline: true},
        {name: 'Guild Population:', value: guild.memberCount, inline: true}
    )
    return embed;
}

function embedPushRole (embed, role) {
    const hexColor = role.color.toString(16).padStart(6, '0');
    embed.fields.push (
        {name: 'Role:', value: role.mention, inline: true},
        {name: 'Role ID:', value: role.id, inline: true},
        {name: 'Role Color', value: '[#' + hexColor + '](https://www.google.com/search?q=%23' + hexColor + ')', inline: true}
    );
    return embed;
}