// DEFINE ----------------------------------------------------------------------------------------------------------------------------------------------------------------
const fs = require ('fs'); // Declares file system management thing
const discord = require ('discord.js'); // Javascript npm of Discord
const cron = require('node-cron'); // Declares cron (automated timing)
const mongo = require ('mongoose'); // Database
const config = require ('./config.json'); // Config file where everything is organized
const client = new discord.Client (); // The client
client.external = new discord.Collection (); // The client and external files
const cooldowns = new discord.Collection();
const guildInvites = new Map(); // Get a map of all guild invites

// Declaring global variables
global.config = config;
global.discord = discord;
global.client = client;
global.fs = fs;
global.mongo = mongo;

// Code with script used above
const userinfodb = require ('./database/userinfo.js'); // Userinfo file for Mongoose
global.userinfodb = userinfodb
//Setting up database
const uri = 'mongodb+srv://FiNSFlexin:happyn06@amediscord-j3h3c.mongodb.net/discord?retryWrites=true&w=majority';
mongo.connect (uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Get external files
const externalFiles = fs.readdirSync ('./external').filter (file => file.endsWith('.js')); // Gets all Javascript files under /external/
for (const file of externalFiles) {
    const external = require (`./external/${file}`); // Gets the file itself
    client.external.set (external.name, external); // Sets the file name
}

// Activates when updated
client.on ('ready', () => {
    console.log ('active'); // To test if active
    client.user.setActivity ('for -help', {type: "WATCHING"}); // Sets activity... "Watching for -help"
    cron.schedule('0 0,30 * * * *', () => { // Starts cron-node
        console.log ('still on'); // Wakes up heroku
    })
    client.guilds.cache.forEach(guild => {
        guild.fetchInvites()
        .then(invites => guildInvites.set(guild.id, invites))
    });
})

// JOINS -----------------------------------------------------------------------------------------------------------------------------------------------------------------
client.on('inviteCreate', async invite => guildInvites.set(invite.guild.id, await invite.guild.fetchInvites()));
client.on ('guildMemberAdd', async member => {
    let welcomechannel = member.guild.channels.cache.get (config.channels.welcome); // Get welcome channel
    let infochannel = member.guild.channels.cache.get (config.channels.info); // Get info channel
    let logchannel = member.guild.channels.cache.get (config.channels.log);
    let welcomemessage = new discord.MessageEmbed () // Create welcome message
    .setAuthor (member.user.username, member.user.avatarURL ({dynamic: true}), 'https://discordapp.com/users/' + member.user.id)
    .setTimestamp ();
    let welcomemessagelog = new discord.MessageEmbed () // Creates log message
    .setTimestamp ()
    .setThumbnail (member.user.avatarURL ({dynamic: true}))
    .addField ('**User:**', member, true)
    .addField ('ID:', member.id, true)
    .addField ('Position:', member.guild.memberCount, true)
    await userinfodb.findOne ({ // Finds something in Mongoose with this info
        userID: member.user.id,
        serverID: member.guild.id
    },
    (err, oldjoiner) => { // Gets error and output
        if (oldjoiner) { // If returning member
            let color = config.embedcolors.white [Math.floor(Math.random() * config.embedcolors.white.length)]; // Random color
            welcomemessage.setTitle ('Member - Returned')
            .setDescription (`Welcome back ${member}! Read ${infochannel} for more information regarding this server!`)
            .setColor (color)
            let color2 = config.embedcolors.blue [Math.floor(Math.random() * config.embedcolors.blue.length)]; // Random color
            welcomemessagelog.setTitle ('Member - Returned')
            .setDescription (`A guild member returned: **${member.user.username}**`)
            .setColor (color2)
        }
        else { // If new member
            let color = config.embedcolors.blue [Math.floor(Math.random() * config.embedcolors.blue.length)]; // Random color
            welcomemessage.setTitle ('Member - Joined')
            .setDescription (`Welcome ${member}! Read ${infochannel} for more information regarding this server!`)
            .setColor (color);
            let color2 = config.embedcolors.blue [Math.floor(Math.random() * config.embedcolors.blue.length)]; // Random color
            welcomemessagelog.setTitle ('Member - Joined')
            .setDescription (`A guild member joined: **${member.user.username}**`)
            .setColor (color2);
            const newuserinfo = new userinfodb ({ // Sets values for new member
                userID: member.id,
                serverID: member.guild.id,
                money: 0,
                state: 'ny'
            });
            newuserinfo.save(); // Saves new values into database
        }
    })
    const cachedInvites = guildInvites.get (member.guild.id);
    await member.guild.fetchInvites().then (newInvites => {
        guildInvites.set(member.guild.id, newInvites);
        const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code).uses < inv.uses);
        if (usedInvite == null) return welcomemessagelog.addField ('Invite:', 'Invite link can not be obtained', false);
        let differencetime = member.joinedTimestamp - usedInvite.createdTimestamp;
        let differenceday = differencetime / (1000 * 60 * 60 * 24);
        let sortedmembers = member.guild.members.cache.array().sort((a, b) => a.joinedAt - b.joinedAt);
        let joinposition = 0;
        try {
            for (j = 0; j < sortedmembers.length; j++) {
                if (sortedmembers[j].id == usedInvite.inviter.id) return joinposition = j + 1;
            }
        }
        catch {
            joinposition == '??';
        }
        finally {
            return welcomemessagelog.addField ('**Inviter:**', usedInvite.inviter, true)
            .addField ('ID:', usedInvite.inviter.id, true)
            .addField ('Position:', joinposition, true)
            .addField ('**Invite:**', usedInvite.code, true)
            .addField ('Age:', differenceday.toFixed (1) + ' days', true)
            .addField ('Usage:', usedInvite.uses, true)
            .addField ('URL:', usedInvite.url, false)
        }
    })
    welcomechannel.send (welcomemessage);
    logchannel.send (welcomemessagelog);
    const addedroles = ['707571677948543026', '709329330278236181']; // Gets citizen role
    addedroles.forEach (role => { // Independently do things to selected roles
        let role2 = member.guild.roles.cache.get (role); // Cache roles
        member.roles.add (role2); // Add roles independently
    })
})

// LEAVES ----------------------------------------------------------------------------------------------------------------------------------------------------------------
client.on ('guildMemberRemove', async member => {
    let welcomechannel = member.guild.channels.cache.get (config.channels.welcome); // Get welcome channel
    let logchannel = member.guild.channels.cache.get (config.channels.log);
    let color = config.embedcolors.red [Math.floor(Math.random() * config.embedcolors.red.length)]; // Random color
    let color2 = config.embedcolors.red [Math.floor(Math.random() * config.embedcolors.red.length)]; // Random color
    let sortedmembers = member.guild.members.cache.array();
    sortedmembers.push (member)
    sortedmembers.sort((a, b) => a.joinedAt - b.joinedAt);
    let joinposition = 0;
    try {
        for (j = 0; j < sortedmembers.length; j++) {
            if (sortedmembers[j].id == member.id) return joinposition = j + 1;
        }
    }
    catch {
        joinposition = '??'
    }
    finally {
        let welcomemessage = new discord.MessageEmbed () // Create an embed
        .setTimestamp ()
        .setColor (color)
        .setAuthor (member.user.username, member.user.avatarURL ({dynamic: true}), 'https://discordapp.com/users/' + member.user.id)
        let welcomemessagelog = new discord.MessageEmbed () // Creates log message
        .setTimestamp ()
        .setColor (color2)
        .setThumbnail (member.user.avatarURL ({dynamic: true}))
        let lastmessagelog = (member.lastMessage.content) ? member.lastMessage.content.slice (0,63) : 'No apparent last message';
        if (member.lastMessage && member.lastMessage.content.length >= 64) lastmessagelog = lastmessagelog.trim() + '...';
        await member.guild.fetchAuditLogs({ type: 'MEMBER_KICK' }) // Get all kick audit logs
        .then(audit => audit.entries.first()).then (audit => {
            if (audit.target.id !== member.id || audit.createdTimestamp < (Date.now() - 5000)) { // If person wasn't kicked
                welcomemessage.setTitle ('Member - Left')
                .setDescription (`Farewell ${member}! We hope you come back another time!`)
                welcomemessagelog.setTitle ('Member - Left')
                .setDescription (`A guild member left: **${member.user.username}**`)
                .addField ('**User:**', member, true)
                .addField ('ID:', member.id, true)
                .addField ('Position:', joinposition, true)
                .addField ('Last Message:', lastmessagelog.replace( /[\r\n]+/gm," "), false)
            }
            else {
                let kickreason = (audit.reason) ? `\nfor "${audit.reason}"` : '';
                let kickreasonlog = (audit.reason) ? audit.reason.slice (0,63) : 'No specified reason for kicking';
                if (audit.reason && audit.reason.length >= 64) {
                    kickreasonlog = kickreasonlog.trim() + '...';
                    kickreason = kickreason.trim() + '...';
                }
                let executorposition = 0
                try {
                    for (j = 0; j < sortedmembers.length; j++) {
                        if (sortedmembers[j].id == audit.executor.id) return executorposition = j + 1;
                    }
                }
                catch {
                    executorposition = '??'
                }
                finally {
                    welcomemessage.setTitle ('Member - Kicked')
                    .setDescription (`Farewell ${member}! They have been kicked by ${audit.executor}${kickreason.replace( /[\r\n]+/gm," ")}!`)
                    welcomemessagelog.setTitle ('Member - Kicked')
                    .setDescription (`A guild member got kicked: **${member.user.username}**`)
                    .addField ('**Target:**', member, true)
                    .addField ('ID:', member.id, true)
                    .addField ('Position:', joinposition, true)
                    .addField ('Last Message:', lastmessagelog.replace( /[\r\n]+/gm," "), false)
                    .addField ('**Executor:**', audit.executor, true)
                    .addField ('ID:', audit.executor.id, true)
                    .addField ('Position:', executorposition, true)
                    .addField ('Reason:', kickreasonlog.replace( /[\r\n]+/gm," "), false)
                }
            }
        })
        welcomechannel.send (welcomemessage);
        logchannel.send (welcomemessagelog);
    }
})

// MESSAGES -----------------------------------------------------------------------------------------------------------------------------------------------------------------
client.on ('message', message => {
    if (!message.channel.type == 'text' || message.author.bot || !message.content.startsWith(config.prefix)) return; // Checks if message was sent in server, by human, with prefix
    let lowermessage = message.content.toLowerCase (); // Lowercases the message
    let args = lowermessage.slice(config.prefix.length).split(/ +/); // Seperates the message into arguments
    const externalex = client.external.find (ext => ext.summoner && ext.summoner.includes (args[0])) // Gets 'summoner' from other files (ways it can be identified)
    if (externalex == null) return message.reply ('There was an error with the command').then (sentMessage => {  // Error with defining command
        sentMessage.delete({timeout: config.autodelete.sent});
        message.delete ({timeout: config.autodelete.received});
    });
    if (!cooldowns.has(externalex.name)) { // Gets name of command
		cooldowns.set(externalex.name, new discord.Collection()); // A collection of the cooldown
    }
	const timestamps = cooldowns.get (externalex.name); // Get the cooldowns for a specific thing
    const cooldownAmount = (externalex.cooldown || 3) * 1000; // Length of cooldown
    if (timestamps.has(message.author.id)) { // Checks personwise
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount; // time till it cooldown ends
		if (Date.now() < expirationTime) { // Checks if cooldown checks good!
            const timeLeft = (expirationTime - Date.now()) / 1000; // Time left
            let reply = ''; // Defines reply as nothing
            if (timeLeft.toFixed(1) == 1) reply = `Wait ${timeLeft.toFixed(1)} more second before reusing the \`-${externalex.name}\` command.`; // If one second is left exactly
            else reply = `Wait ${timeLeft.toFixed(1)} more seconds before reusing the \`-${externalex.name}\` command.`; // If not one second is left
            return message.reply (reply).then (sentMessage => {  // Error with command
                sentMessage.delete({timeout: timeLeft + 3500});
                message.delete ({timeout: timeLeft + 4000});
            })
        }
	}
	timestamps.set(message.author.id, Date.now()); // Record the time
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); // Deletes the timestamp when it should be over
    try {
        externalex.execute (message, args) // Execute to external file
    }
    catch {
        return message.reply ('There was an error with the command').then (sentMessage => {  // Error with command
            sentMessage.delete({timeout: config.autodelete.sent});
            message.delete ({timeout: config.autodelete.received});
        });
    }
})

// Channel based
client.on ('message', message => {
/*    if (message.channel.type == 'dm' || message.channel.type !== 'text' || message.author.bot) return; /// If the messages was sent in category "USA"
    if ((message.channel.parent !== null || message.channel.parent.id == config.categorys.states) && !message.content.startsWith(config.prefix)) {
        let secretvalue = db.get (`channel.${message.channel.id}.secret`);
        if (secretvalue == true) return;
        if (secretvalue == null) {
            db.set (`channel.${message.channel.id}.secret`, false);
            secretvalue = db.get (`channel.${message.channel.id}.secret`);
        }
        const stateswebhook = new discord.WebhookClient(config.webhooks.statesid, config.webhooks.statestoken); // The webhook specifically designed for this
        let channelm = message.channel.name // The name of the #All-states channel
        channelm = channelm.replace(/-/g, ' '); // Changes state names to no spaces
        channelm = channelm.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); // Uppercase the first letter
        let colors = ['d4002c', '004dc9', 'fefefe']; // American colors
        let color = colors [Math.floor(Math.random() * colors.length)]; // Random color
        let onehourmessages = message.createdTimestamp - 3600000; // One hour since the message was sent
        message.channel.messages.fetch ().then (fetchedmessages => { // Fetch messages
            let fetchedmessages2 = fetchedmessages.filter(msg => msg.createdTimestamp >= onehourmessages); // Filters only messages from the past hour
            const embed = new discord.MessageEmbed() // Creating embed that mimics people
            .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true})) // The picture and name of the messenger
            .setColor (`0x${color}`) // Sets the color
            .setTitle (`In ${channelm}`) // Says the channel
            .setDescription (message.content) // Says what the message was said
            .setTimestamp () // Time
            .setFooter (`${fetchedmessages2.size} messages sent there since the past hour.`) // Messages since the past hour
            stateswebhook.send (embed); // Message sent
        })
    }
    else if (message.channel.parent.id == config.categorys.transport) {
        if (message.content.startsWith (config.prefix)) {
            let lowermessage = message.content.toLowerCase ();
            let args = lowermessage.slice (config.prefix.length).split(/ +/);
            if (!Object.keys(config.transport).includes (args[0])) {
                message.delete ();
            }
        }
        else {
            message.delete ();
        }
    }
    */
})

// Confirming the bots token
client.login(config.token);