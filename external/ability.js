module.exports = {
    name: 'use', // Name referred to execute
    description: 'To use an item or thing purchased', // Description of file
    summoner: ['use', 'activate', 'usage', 'apply', 'uses', 'ability', 'u'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        try {
            client.abilities = new discord.Collection (); // The client and external files
            const abilityFiles = fs.readdirSync ('./external/ability').filter (file => file.endsWith('.js')); // Gets all Javascript files under /external/
            for (const file of abilityFiles) {
                const ability = require (`./ability/${file}`); // Gets the file itself
                client.abilities.set (ability.name, ability); // Sets the file name
            }
            const abilityex = client.abilities.find (abi => abi.summoner && abi.summoner.includes (args[1])) // Gets 'summoner' from other files (ways it can be identified)
            abilityex.execute (message, args) // Execute to external file
        }
        catch {
            message.reply ('There was an error using the use command, the correct syntax usage is `-use <item> [options]`!\nYou could also type `-help use`').then (sentMessage => { // If can't travel anywhere
                sentMessage.delete({timeout: config.autodelete.sent});
                message.delete ({timeout: config.autodelete.receive})
            });
        }
    }
}