module.exports = {
    name: 'secret', // Name referred to execute
    description: 'Make a channel secret and not shown in #all-states', // Description of file
    summoner: ['secret', 's', 'sec', 'hidden', 'hide', 'classified', 'confidential', 'covert'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        let balance = db.get (`member.${message.author.id}.money`); // Get their money
        let totaltime = args[2] + (args[3] * 60)
        let cost = (balance / 150) + (totaltime / 6)^1.1 + 4
        const secretinventory = db.get (`member.${message.author.id}.abilities`); // All secrets in abilities
        if (!isNaN(args[2]) && !isNaN(args[3])) {
            return message.reply ('That command is `-shop secret <minutes> [hours] [optional]`').then (sentMessage => replymessage(sentMessage)); // Activate delete function
        }
        if (totaltime <= 5) {
            return message.reply ('You can\'t buy a secret ability that lasts for five seconds or less').then (sentMessage => replymessage(sentMessage)); // Activate delete function
        }
        if (balance <= cost) {
            return message.reply ('You don\'t have enough money to buy this!').then (sentMessage => replymessage(sentMessage)); // Activate delete function
        }
        return message.reply (`Are you sure you want to buy a secret for ${cost}?`).then (sentMessage => { // Confirmation message
            sentMessage.react ('👍'); // React
            message.delete();
            const filter = (reaction, user) => { // Creates the filter for the collector
                return reaction.emoji.name === '👍' && user.id === message.author.id; // Author mentions thumbs up
            };
            const confirmcollector = sentMessage.createReactionCollector(filter,{time: config.autodelete.collector}); // Collector
            confirmcollector.on ('collect', () => { // Collected despite filter
                sentMessage.delete (); // Delete
                confirmcollector.stop ('ability done'); // Reason so it won't activate an event
                message.reply (`You have successfully bought a secret for ${cost}! You now have ${secretinventory.length}`).then (sentMessage2 => { // Completed transaction message
                    sentMessage2.delete ({timeout: config.autodelete.sentlong});
                });
            });
            confirmcollector.on ('end', (collected, reason) => { // When it ends
                if (reason !== 'ability done'){ // Only ends through nonresponsiveness
                    message.reply (`You waited too long to confirm your purchase!`).then (sentMessage2 => { // Cancelled message
                        sentMessage2.delete ({timeout: config.autodelete.sentlong});
                    });
                }
            })
        })
        function replymessage (sentMessage) {
            sentMessage.delete({timeout: config.autodelete.sent});
            message.delete ({timeout: config.autodelete.received});
        }
    }
}