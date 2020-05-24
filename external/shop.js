module.exports = {
    name: 'shop', // Name referred to execute
    description: 'To purchase things in the shop', // Description of file
    summoner: ['shop', 'buy', 'purchase', 'store', 'shops', 'buys'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        let balance = db.get (`member.${message.author.id}.money`); // Get their money
        if (balance <= 0) {
            return message.reply ('You can\'t buy anything in the shop with no money, type `-help shop` for more information').then (sentMessage => replymessage(sentMessage)); // Activate delete function
        }
        else {
            try {
                client.shop = new discord.Collection (); // The client and external files
                const shopFiles = fs.readdirSync ('./external/shop').filter (file => file.endsWith('.js')); // Gets all Javascript files under /external/
                for (const file of shopFiles) {
                    const shopf = require (`./shop/${file}`); // Gets the file itself
                    client.shop.set (shopf.name, shopf); // Sets the file name
                }
                const shopex = client.shop.find (shp => shp.summoner && shp.summoner.includes (args[1])) // Gets 'summoner' from other files (ways it can be identified)
                return shopex.execute (message, args) // Execute to external file
            }
            catch(err) { // If syntax was used wrongly
                return message.reply ('There was an error using the use command, the correct syntax usage is `-shop <item> [options]`!\nYou could also type `-help store`').then (sentMessage => replymessage(sentMessage)); // Activate delete function
            }
        }
        function replymessage (sentMessage) {
            sentMessage.delete({timeout: config.autodelete.sent});
            message.delete ({timeout: config.autodelete.received});
        }
    }
}