const fs = require ('fs');
const discord = require ('eris');
const cron = require('node-cron');
const mongo = require ('mongoose');
const canvas = require ('canvas');
const fetch = require('node-fetch');
const config = require ('./config.json');
const errorLog = require ('./external/error.js')
const {ReactionCollector, MessageCollector} = require ('eris-collector');
require('dotenv').config();
const {randomColor, getUserInfo} = require ('./external/functions');

const client = new discord(process.env.DISCORD_TOKEN, {
    restMode: true
});
client.external = new discord.Collection();
const cooldowns = new Map();
const guildInvites = new Map();

global.config = config;
global.discord = discord;
global.client = client;
global.guildInvites = guildInvites;
global.canvas = canvas;
global.cron = cron;
global.fetch = fetch;
global.reactionCollector = ReactionCollector;
global.messageCollector = MessageCollector;
global.errorLog = errorLog;

const userInfoDB = require ('./database/userinfo.js');
const stateInfoDB = require ('./database/stateinfo.js');

const uri = process.env.MONGODB_URI;
mongo.connect (uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const externalFiles = fs.readdirSync ('./external').filter (file => file.endsWith('.js'));
for (const file of externalFiles) {
    const external = require (`./external/${file}`);
    client.external.set (external.name, external);
};

client.on ('ready', () => {
    console.log ('active');
    client.editStatus('online', {name: 'for -help', type: 3})
    cron.schedule ('0 0,30 * * * *', () => {
        console.log ('still on');
    })
    client.guilds.forEach(async guild => {
        guild.getInvites().then(invites => guildInvites.set(guild.id, invites))
        const travelRole = guild.roles.find (ele => ele.id == process.env.ROLE_TRAVELING);
        guild.members.forEach (async member => {
            if (member.roles.includes (travelRole.id)) {
                let userInfo = await userInfoDB.findOne ({
                    userID: member.id,
                    guildID: guild.id
                })
                userInfo.arrival = {from: null, timestamp: null, cost: null};
                userInfo.save();
                const toRole = guild.roles.find (ele => ele.name == config.places[userInfo.state].name);
                member.removeRole(travelRole.id);
                member.addRole(toRole.id);
                const stateInfo = await getStateInfo (guild, userInfo.state)
                if (stateInfo.welcomeMessage) {
                    const governor = guild.members.find (ele => ele.id == stateInfo.governorID)
                    embed = {
                        title: 'Travel - Arrival',
                        description: stateInfo.welcomeMessage,
                        timestamp: new Date().toISOString(),
                        fields: [
                            {name: 'State:', value: config.places[userInfo.state].name, inline: true},
                            {name: 'From:', value: config.places[userInfo.arrival.from].name, inline: true},
                            {name: 'Governor:', value: governor.mention, inline: true}
                        ]
                    }
                }
            }
        })
        const startedChannel = guild.channels.find (ele => ele.parentID == process.env.CHANNEL_P_STARTED && ele.name.charAt(0) == '╙');
        const permissionOverwrites = Array.from(startedChannel.permissionOverwrites.values());
        const newStartChannel = await guild.createChannel (startedChannel.name, startedChannel.type, {nsfw: startedChannel.nsfw, parentID: startedChannel.parentID, permissionOverwrites: permissionOverwrites, rateLimitPerUser: startedChannel.rateLimitPerUser, reason: 'Automated', topic: startedChannel.topic});
        startedChannel.delete()
        const informationChannel = guild.channels.find (ele => ele.id == process.env.CHANNEL_INFO);
        let embed = {
            timestamp: new Date().toISOString(),
            color: randomColor ('all'),
            title: 'Introductions',
            description: 'Welcome to *' + guild.name + '*, please follow the rules listed in ' + informationChannel.mention + ' as you journey through the server.\nBegin by typing your ideal starting state using the formatting: `-EX` or `-Example`.',
            fields: [
                {name: 'States:', value: '`AK`| `AL`| `AR`| `AZ`| `CA`| `CO`| `CT`| `DE`| `FL`| `GA`| `HI`| `IA`| `ID`| `IL`| `IN`| `KS`| `KY`| `LA`| `MA`| `MD`| `ME`| `MI`| `MN`| `MO`| `MS`| `MT`| `NC`| `ND`| `NE`| `NH`| `NJ`| `NM`| `NV`| `NY`| `OH`| `OK`| `OR`| `PA`| `RI`| `SC`| `SD`| `TN`| `TX`| `UT`| `VA`| `VT`| `WA`| `WI`| `WV`| `WY`', inline: false},
            ]
        }
        newStartChannel.createMessage ({embed: embed});
        const playerArray = guild.members.filter (ele => ele.roles.length == 0);
        if (playerArray.length <= 0) return;
        let welcomeEmbed = {
            timestamp: new Date().toISOString(),
        }
        const welcomeChannel = guild.channels.find (ele => ele.id == process.env.CHANNEL_WELCOME);
        playerArray.forEach (async (ele) => {
            const userInfo = await getUserInfo (ele, guild);
            if (!userInfo || !userInfo.roleID.length) {
                let rolesID = [];
                guild.roles.forEach (ele2 => {
                    if (!process.env.ROLE_NEW.split(',').includes (ele2.id)) return;
                    rolesID.push (ele2.id);
                })
                ele.edit ({roles: rolesID});
            }
            else ele.edit ({roles: userInfo.roleID});
        })
        if (playerArray.length == 1) {
            welcomeEmbed.color = randomColor ('white');
            welcomeEmbed.title = 'Member - Arrived';
            welcomeEmbed.description = 'Welcome ' + playerArray[0].mention + '. Approve yourself into this server by reading ' + newStartChannel.mention + '. The transmission of this message was delayed because the bot was either hibernating or updating';
        }
        else {
            welcomeEmbed.color = randomColor ('blue');
            welcomeEmbed.title = 'Members - Arrived';
            welcomeEmbed.description = 'Welcome new members. Approve yourselves into this server by reading ' + newStartChannel.mention + '. The transmission of this message was delayed because the bot was either hibernating or updating';
        }
        let contentString = 'To all new members,';
        if (playerArray.length < 10) {
            contentString = '';
            playerArray.forEach (ele => contentString = contentString + ele.mention + ', ');
        }
        welcomeChannel.createMessage ({content: contentString, embed: welcomeEmbed});
    })
})

client.on ('messageCreate', message => {
    if (!message.guildID || message.author.bot || (message.channel.parentID == process.env.CHANNEL_P_STARTED && message.channel.name.charAt(0) == '╙')) return;
    let prefix;
    config.discordInfo.prefix.forEach (ele => {if (message.content.startsWith(ele)) prefix = ele})
    if (prefix == null) return;
    const lowermessage = message.content.toLowerCase ();
    let args = lowermessage.slice(prefix.length).split(/ +/);
    if (args[0] == '') {
        message.mentions.shift();
        args.shift();
    }
    const externalex = client.external.find (ext => ext.summoner && ext.summoner.includes (args[0]));
    if (externalex == null) return errorLog (message, args, 'General', 'notCommand');
    if (!cooldowns.has(externalex.name)) {
		cooldowns.set(externalex.name, new discord.Collection());
    }
    const configCommand = config.commands[externalex.name];
	const timestamps = cooldowns.get (externalex.name);
    if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + 1500;
		if (Date.now() < expirationTime) {
            const timeLeft = (expirationTime - Date.now()) / 1000;
            return errorLog (message, args, configCommand.name, 'cooldown', [timeLeft.toFixed(1)]);
        }
    }
    if (!configCommand.channels.some(ele => ele == 'all' || (ele == 'bot' && message.channel.id == process.env.CHANNEL_BOT) || (ele == 'spam' && message.channel.id == process.env.CHANNEL_SPAM) || (ele == 'store' && message.channel.id == process.env.CHANNEL_STORE) || (ele == 'transport' && message.channel.parentID == process.env.CHANNEL_STORE))) {
        breaker: {
            let breaker;
            if (configCommand.channels.includes ('state')) {
                let category = message.channel.guild.channels.find (ele => ele.id == message.channel.parentID);
                if (!category) return;
                breaker = Object.keys(config.places).some (ele => config.places[ele].name.toLowerCase() == category.name.toLowerCase())
            }
            if (breaker) break breaker;
            return errorLog (message, args, configCommand.name, 'channel', []);
        }
    }
	timestamps.set(message.author.id, Date.now());
    setTimeout(() => timestamps.delete(message.author.id), 1500);
    try {
        externalex.execute (message, args);
    }
    catch {
        return errorLog (message, args, 'General', 'general');
    }
})

client.connect();

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