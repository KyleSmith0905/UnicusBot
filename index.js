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
const fs = require ('fs'); // File
const db = require('quick.db')
const discord = require ('discord.js'); // Javascript npm of Discord
const config = require ('./config.json'); // Config file where everything is organized
const client = new discord.Client (); // The client
client.external = new discord.Collection (); // The client and external files

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
    client.user.setActivity ('for -help', {type: "WATCHING"});
})

// Activates when someone joins
client.on ('guildMemberAdd', member => {
    const addedroles = member.guild.roles.cache.get ('707571677948543026'); // Gets citizen role
    member.roles.add (addedroles); // Welcomes role
})

// Activates when a message is sent
client.on ('message', message => {
    if (!message.channel.type == 'text' || message.author.bot || !message.content.startsWith(config.prefix)) return; // Checks if message was sent in server, by human, with prefix
    let lowermessage = message.content.toLowerCase (); // Lowercases the message
    let args = lowermessage.slice(config.prefix.length).split(/ +/); // Seperates the message into arguments
    const externalex = client.external.find (ext => ext.summoner && ext.summoner.includes (args[0])) // Gets 'summoner' from other files (ways it can be identified)
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