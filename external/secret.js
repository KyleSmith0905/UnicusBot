module.exports = {
    name: 'secret', // Name referred to execute
    description: 'Make a channel secret and not shown in #all-states', // Description of file
    summoner: ['secret', 's', 'sec', 'hidden', 'hide', 'classified', 'confidential', 'covert'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        if (message.channel.parent.id !== config.categorys.states) {
            return message.reply ('This command can only be done in the state\s channels!').then (sentMessage => {  // Error with command
                sentMessage.delete({timeout: config.autodelete.sent});
                message.delete ({timeout: config.autodelete.received});
            });
        }
        if (!isNaN(args[1]) || !isNaN(args[2])) {
            return message.reply ('There was an error using the secret command, the correct syntax usage is `-secret <minutes> [hours] [options]`!\nYou could also type `-help secret`').then (sentMessage => {  // Error with command
                sentMessage.delete({timeout: config.autodelete.sent});
                message.delete ({timeout: config.autodelete.received});
            });
        }
        let totaltime = args[1] + (args[2] * 60)
        if (totaltime <= 4) {
            return message.reply ('You can\'t have the secret last for less than 5 minutes').then (sentMessage => {  // Error with command
                sentMessage.delete({timeout: config.autodelete.sent});
                message.delete ({timeout: config.autodelete.received});
            });
        }
        let balance = db.get (`member.${message.author.id}.money`); // Get their money
        let secretvalue = db.get (`channel.${message.channel.id}.secret`);
        if (secretvalue == null) {
            db.set (`channel.${message.channel.id}.secret`, false);
            secretvalue = db.get (`channel.${message.channel.id}.secret`);
        }
        if (balance == 0) {
            return message.reply ('You can\'t buy anything here with no money!').then (sentMessage => {  // Error with command
                sentMessage.delete({timeout: config.autodelete.sent});
                message.delete ({timeout: config.autodelete.received});
            })
        }
        message.guild.members.fetch().then(fetchedMembers => {
            const totalonline = fetchedMembers.filter(member => member.roles.cache.find === 'online');
            const totalonlinecount = totalonline.size
        });
        if (secretvalue == false) {
            let cost = Math.round(((balance / 100) + 5) * (totaltime / 10) + 2)
            if (cost >= balance) {
                return message.reply (`You don't have enough money for this, it costs **$${cost}** and you have **$${balance}**`).then (sentMessage => {  // Error with command
                    sentMessage.delete({timeout: config.autodelete.sentlong});
                    message.delete ({timeout: config.autodelete.receivedlong});
                })
            }
            return message.reply (`Are you sure you want to make ${message.channel} secret for **$${cost}**?`).then (sentMessage => { // Confirmation message
				sentMessage.react ('👍'); // React
				const filter = (reaction, user) => { // Creates the filter for the collector
					reaction.emoji.name === '👍' && user.id === message.author.id; // Author mentions thumbs up
				};
				const confirmcollector = sentMessage.createReactionCollector(filter,{time: config.autodelete.collector}); // Collector
				confirmcollector.on ('collect', () => { // Collected despite filter
					sentMessage.delete (); // Delete
					confirmcollector.stop ('transaction done'); // Reason so it won't activate an event
					message.reply (`The transaction of **$${args[3]}** to ${mention} was completed, you now have **$${balance}$$ right now!${additional2}`).then (sentMessage2 => { // Completed transaction message
						sentMessage2.delete ({timeout: config.autodelete.sentlong});
					});
				});
				confirmcollector.on ('end', (collected, reason) => { // When it ends
					if (reason !== 'transaction done'){ // Only ends through nonresponsiveness
						message.reply (`The transaction of **$${args[3]}** to ${mention} was cancelled!`).then (sentMessage2 => { // Cancelled message
							sentMessage2.delete ({timeout: config.autodelete.sentlong});
						});
					}
				})
			})
        }
    }
}