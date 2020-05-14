/*----- TO DO ------------------------
Money system
    Create Table
    Adjust balues
Roles system
Use reply instead of send
Change "return" to before the delay
Move all messages to 'let reply' and later 'message.send (reply)'
*/

// heroku ps:scale worker=1
// git commit -am 'Updated through terminal'

// Declaring constants
const fs = require ('fs'); // Declares file system management thing
const db = require('quick.db') // Declares db (Database)
const discord = require ('discord.js'); // Javascript npm of Discord
const config = require ('./config.json'); // Config file where everything is organized
const cron = require('node-cron'); // Declares cron (automated timing)
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
    let guild = client.guilds.cache.get (config.guild) // Defines the guild
    let logchannel = guild.channels.cache.get (config.channels.log) // Defines the log channel
    cron.schedule('0 0,30 * * * *', () => { // Defines the "bump"
        logchannel.send ('Reminder to say `!d bump`'); // Bump!
    })
})

// Activates when someone joins
client.on ('guildMemberAdd', member => {
    db.set (`member.${member.id}.state`, 'ny') // Default spawn... "New York"
    const addedroles = ['707571677948543026', '709329330278236181']; // Gets citizen role
    addedroles.forEach (role => { // Independently do things to selected roles
        let role2 = member.guild.roles.cache.get (role); // Cache roles
        member.roles.add (role2); // Add roles independently
    })
    let balance = db.get (`member.${member.author.id}.money`); // Get their money
    if (balance == null) { // If not already have money, get it
        db.set (`member.${message.author.id}.money`, 0); // Set money
        balance = db.get (`member.${message.author.id}.money`); // Get money again
    }
})

// Commands
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
    const now = Date.now(); // Get the time now
	const timestamps = cooldowns.get (externalex.name); // Get the cooldowns for a specific thing
    const cooldownAmount = (externalex.cooldown || 3) * 1000; // Length of cooldown
    if (timestamps.has(message.author.id)) { // Checks personwise
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount; // time till it cooldown ends
		if (now < expirationTime) { // Checks if cooldown checks good!
            const timeLeft = (expirationTime - now) / 1000; // Time left
            let reply = ''; // Defines reply as nothing
            if (timeLeft.toFixed(1) == 1) reply = `Wait ${timeLeft.toFixed(1)} more second before reusing the \`-${externalex.name}\` command.`; // If one second is left exactly
            else reply = `Wait ${timeLeft.toFixed(1)} more seconds before reusing the \`-${externalex.name}\` command.`; // If not one second is left
            return message.reply (reply).then (sentMessage => {  // Error with command
                sentMessage.delete({timeout: timeLeft + 3500});
                message.delete ({timeout: timeLeft + 4000});
            })
        }
	}
	timestamps.set(message.author.id, now); // Record the time
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); // Deletes the timestamp when it should be over
    let balance = db.get (`member.${message.author.id}.money`); // Get their money
    if (balance == null) { // If not already have money, get it
        db.set (`member.${message.author.id}.money`, 0); // Set money
        balance = db.get (`member.${message.author.id}.money`); // Get money again
    }
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
    if (message.channel.parent.id !== config.categorys.states || !message.channel.type == 'text' || message.author.bot || message.content.startsWith(config.prefix)) return; /// If the messages was sent in category "USA"
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
})

// Confirming the bots token
client.login(config.token);