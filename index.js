/*----- TO DO ------------------------
Money system
    Create Table
    Adjust balues
Roles system
Use reply instead of send
Change "return" to before the delay
Move all messages to 'let reply' and later 'message.send (reply)'
*/

// Declaring constants
const fs = require ('fs'); // Declares file system management thing
const db = require('quick.db') // Declares db (Database)
const discord = require ('discord.js'); // Javascript npm of Discord
const config = require ('./config.json'); // Config file where everything is organized
let CronJob = require('cron').CronJob; // Declares cron (automated timing)
const client = new discord.Client (); // The client
client.external = new discord.Collection (); // The client and external files
const cooldowns = new discord.Collection();

// Declaring global variables
global.config = config;
global.discord = discord;
global.db = db;

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
    let CronJob = require('cron').CronJob; // Creates a cron for bumping
    let guild = client.guilds.cache.get (config.guild) // Defines the guild
    let logchannel = guild.channels.cache.get (config.channels.log) // Defines the log channel
    let bump = new CronJob('0 0 */2 * * *', function() { // Defines the "bump"
        logchannel.send ('!d bump'); // Bump!
    })
    bump.start() // Start
})

// Activates when someone joins
client.on ('guildMemberAdd', member => {
    db.set (`member.${member.id}.state`, 'ny') // Default spawn... "New York"
    const addedroles = ['707571677948543026', '709329330278236181']; // Gets citizen role
    addedroles.forEach (role => { // Independently do things to selected roles
        let role2 = member.guild.roles.cache.get (role); // Cache roles
        member.roles.add (role2); // Add roles independently
    })
})

// Activates when a message is sent
client.on ('message', message => {
    if (!message.channel.type == 'text' || message.author.bot || !message.content.startsWith(config.prefix)) return; // Checks if message was sent in server, by human, with prefix
    let lowermessage = message.content.toLowerCase (); // Lowercases the message
    let args = lowermessage.slice(config.prefix.length).split(/ +/); // Seperates the message into arguments
    const externalex = client.external.find (ext => ext.summoner && ext.summoner.includes (args[0])) // Gets 'summoner' from other files (ways it can be identified)
    if (!cooldowns.has(externalex.name)) {
		cooldowns.set(externalex.name, new discord.Collection());
    }
    const now = Date.now();
	const timestamps = cooldowns.get (externalex.name);
    const cooldownAmount = (externalex.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
		if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            let reply = '';
            if (timeLeft.toFixed(1) == 1) reply = `Wait ${timeLeft.toFixed(1)} more second before reusing the \`-${externalex.name}\` command.`;
            else reply = `Wait ${timeLeft.toFixed(1)} more seconds before reusing the \`-${externalex.name}\` command.`;
            return message.reply (reply).then (sentMessage => {  // Error with command
                sentMessage.delete({timeout: timeLeft + 3500});
                message.delete ({timeout: timeLeft + 4000});
            })
        }
	}
	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    try {
        externalex.execute (message, args) // Execute to external file
    }
    catch {
        return message.channel.send (`${message.author} There was an error with the command`).then (sentMessage => {  // Error with command
            sentMessage.delete({timeout: config.autodelete.sent});
            message.delete ({timeout: config.autodelete.received});
        });
    }
})

// Confirming the bots token
client.login(config.token);