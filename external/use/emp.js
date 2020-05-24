module.exports = {
    name: 'emp', // Name referred to execute
    description: 'Make a channel secret and not shown in #all-states', // Description of file
    summoner: ['emp', 'hack'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        let combineargs = `emp${args[2]}`; // Makes 'secret1' from '-use secret 1'
        const secretinventory2 = db.get (`member.${message.author.id}.abilities`); // All secrets in abilities
        const secretinventory = db.get (`member.${message.author.id}.abilities.emp.${combineargs}`); // Specific secret in abilities
        if (secretinventory2 == null){ // No secret abilities at all
            return message.reply ('You don\'t have any secret abilities to use, try typing `-shop emp <minutes> [hours] [options]`!').then (sentMessage => replymessage (sentMessage)); // Calls to replymessage function
        }
        if (secretinventory == null){ // No secret abilities with that name
            return message.reply (`You don\'t have a secret ability by the name of ${combineargs}!`).then (sentMessage => replymessage (sentMessage)); // Calls to replymessage function
        }
        if (message.channel.parent.id !== config.categorys.states) { // Needs to be in a state channel
            return message.reply ('This command can only be done in the state channels!').then (sentMessage => replymessage (sentMessage)); // Calls to replymessage function
        }
        let secretvalue = db.get(`channel.${message.channel.id}.secret`); // Get if channel is secret
        if (secretvalue == null) { // If channel doesn't have that value
            db.set (`channel.${message.channel.id}.secret`, false); // Make the channel false on default
            secretvalue = db.get(`channel.${message.channel.id}.secret`); // Re-sets it
        }
        if (secretvalue == true) { // Channel is already secreted
            return message.reply ('This channel has already been EMPed!').then (sentMessage => replymessage (sentMessage)); // Calls to replymessage function
        }
        else if (secretvalue == false) { // If channel isnt already secret!
            return message.reply (`Are you sure you want to make ${message.channel} secret?`).then (sentMessage => { // Confirmation message
                sentMessage.react ('👍'); // React
                message.delete();
				const filter = (reaction, user) => { // Creates the filter for the collector
					reaction.emoji.name === '👍' && user.id === message.author.id; // Author mentions thumbs up
				};
				const confirmcollector = sentMessage.createReactionCollector(filter,{time: config.autodelete.collector}); // Collector
				confirmcollector.on ('collect', () => { // Collected despite filter
					sentMessage.delete (); // Delete
					confirmcollector.stop ('ability done'); // Reason so it won't activate an event
					message.reply (`You have successfully used ${secretinventory}, you still have ${secretinventory.length} left to use!`).then (sentMessage2 => { // Completed transaction message
						sentMessage2.delete ({timeout: config.autodelete.sentlong});
					});
				});
				confirmcollector.on ('end', (collected, reason) => { // When it ends
					if (reason !== 'ability done'){ // Only ends through nonresponsiveness
						message.reply (`You waited too long to confirm using your ${secretinventory} on this channel!`).then (sentMessage2 => { // Cancelled message
							sentMessage2.delete ({timeout: config.autodelete.sentlong});
						});
					}
				})
			})
        }
        function replymessage (sentMessage) {
            sentMessage.delete({timeout: config.autodelete.sent});
            message.delete ({timeout: config.autodelete.received});
        }
    }
}