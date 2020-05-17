module.exports = {
    name: 'money', // Name referred to execute
    description: 'Changing and adjusting currency values', // Description of file
	summoner: ['money', 'currency', 'economy', '$', 'cash'], // Things that activate this
	cooldown: 1,
	execute (message, args) {
// USERS -----------------------------------------------------------------------------------------------------------------------------------------------------------------
		let balance = db.get (`member.${message.author.id}.money`); // Get their money
		// BALANCE -------------------------------------------------------------------------------------------------------------------------------------------------------
		if (config.money.balance.includes(args[1])) { // Asking for balance
			if (args[2] && (!args[2].match(/^<@!?(\d+)>$/) || args[3])) { // Checks if syntax was correct
				return message.reply ('There was an error, try using just `-money balance [mention]`').then (sentMessage => replymessage(sentMessage))
			}
			const mention = message.mentions.members.first() || message.author; // Get cache of balnce person
			let balance = db.get (`member.${mention.id}.money`); // Get their money
			if (balance == null){ // If not already have money, get it
				db.set (`member.${mention.id}.money`, 0); // Set money
				balance = db.get (`member.${mention.id}.money`); // Get money again
			}
			balance.toLocaleString()
			let balancemessage = ''; // Defines this
			if (mention.id == message.author.id) { // If balance was requested by author
				balancemessage = `You have **$${balance}** on you right now!`; // Says balance
			}
			else {
				balancemessage = `${mention} has **$${balance}** on them right now!`; // Says balance
			};
			return message.reply (balancemessage).then (sentMessage => replymessagelong(sentMessage));
		} 
		// PAY -----------------------------------------------------------------------------------------------------------------------------------------------------------
		else if (config.money.pay.includes(args[1])) { // Paying someone else money, sharing basically
			if (!args[2] || !args[2].match(/^<@!?(\d+)>$/) || isNaN(args[3])) { // Checks if wrong syntax
				return message.reply ('There was an error, try using just `-money pay <mention> <amount> [additional]`!').then (sentMessage => replymessage(sentMessage))
			}
			if (args[3].includes ('.')) { // Check if transaction will be a decimal
				return message.reply ('Please round to the nearest whole dollar, no cents!').then (sentMessage => replymessage(sentMessage));
			}
			if (args[3] <= 0) { // Paying negative or zero money
				return message.reply ('A transaction can\'t be zero dollars or less').then (sentMessage => replymessage(sentMessage));
			}
			let mention = message.mentions.members.first(); // Gets the mentioned user
			let additional = '' // Additional information for footer
			if (args[4]) {
				additional = message.content.substring(message.content.indexOf(args[4])); // Everything after agument 2
				additional = `\nReason for transaction: ${additional}`;
			}
			let balance1 = db.get (`member.${mention.id}.money`); // Get their money
			if (balance1 == null) { // If not already have money, get it
				db.set (`member.${mention.id}.money`, 0); // Set money
				balance1 = db.get (`member.${mention.id}.money`); // Get money again
			}
			if (message.author.id == mention.id) { // Giving money to yourself
				return message.reply ('You can\'t pay yourself, only other people!').then (sentMessage => replymessage(sentMessage));
			}
			if (args[3] > balance) { // Giving more than you have
				let difference = args[3] - balance
				return message.reply (`You currently have **$${balance}**, that is **$${difference}** less than the amount you are trying to give, **$${args[3]}**!`).then (sentMessage => replymessage(sentMessage));
			}
			return message.reply (`Are you sure you want to give **$${args[3]}** to ${mention}?${additional}`).then (sentMessage => { // Confirmation message
				sentMessage.react ('👍'); // React
				const filter = (reaction, user) => { // Creates the filter for the collector
					return reaction.emoji.name === '👍' && user.id === message.author.id; // Author mentions thumbs up
				};
				const confirmcollector = sentMessage.createReactionCollector(filter,{time: config.autodelete.collector}); // Collector
				confirmcollector.on ('collect', () => { // Collected despite filter
					sentMessage.delete (); // Delete
					confirmcollector.stop ('transaction done'); // Reason so it won't activate an event
					db.subtract (`member.${message.author.id}.money`, args[3])
					db.add (`member.${mention.id}.money`, args[3])
					message.reply (`The transaction of **$${args[3]}** to ${mention} was completed!${additional}`).then (sentMessage => replymessagelong(sentMessage));
				});
				confirmcollector.on ('end', (collected, reason) => { // When it ends
					if (reason !== 'transaction done'){ // Only ends through nonresponsiveness
						message.reply (`The transaction of **$${args[3]}** to ${mention} was cancelled!${additional}`).then (sentMessage => replymessagelong(sentMessage));
					}
				})
			})
		}
// ADMIN -----------------------------------------------------------------------------------------------------------------------------------------------------------------
		// ADD -----------------------------------------------------------------------------------------------------------------------------------------------------------
		else if (config.money.add.includes (args[1]) || config.money.remove.includes (args[1]) || config.money.set.includes (args[1])) { // Add command (admin usage)
			if (message.author.id !== config.owner) { // Not an admin
				return message.reply ('You do not have permissions to use this command!').then (sentMessage => replymessage(sentMessage));
			}
			if (args[3].includes ('.')) {
				return message.reply ('Please round to the nearest whole dollar, no cents!').then (sentMessage => replymessage(sentMessage));
			}
			args[3] = args[3].replace (/,/g, "");
			let mention = message.mentions.members.first(); // Gets the mentioned user
			let addstring = 'add'; // Sentence will say 'add' when adding
			let tostring = 'to';
			let addedstring = 'added';
			let transaction = args[3];
			let transactionabs = Math.abs(args[3]);
			if ((config.money.remove.includes (args[1]) && args[3] > 0) || (config.money.add.includes (args[1]) && args[3] < 0)) { // Check if we're removing money
				addstring = 'remove'; // Sentence will say 'remove' when removing
				tostring = 'from';
				addedstring = 'removed';
				transaction = transaction * -1 // Make official transaction negative
			}
			if (config.money.set.includes (args[1])) { // Check if the message being sent is 'set'
				addstring = 'set';
				addedstring = 'changed';
				mentionbal = db.get (`member.${mention.id}.money`)
				transaction = transaction - mentionbal
			}
			transactionabs = transactionabs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			if (!args[2] || !args[2].match(/^<@!?(\d+)>$/) || isNaN(args[3])) { // Doesn't follow syntax
				return message.reply.reply ('There was an error, try using just `-money ' + addstring + ' <mention> <amount> [additional]`!').then (sentMessage => replymessage(sentMessage));
			}
			else {
				let additional = '' // Additional information for footer
				if (args[4]) {
					additional = message.content.substring(message.content.indexOf(args[4])); // Everything after agument 2
					additional = `\nReason for transaction: ${additional}`;
				}
				let startreply = `Are you sure you want to ${addstring} **$${transactionabs}** ${tostring} ${mention}'s balance?${additional}`;
				let confirmreply = `You have ${addedstring} **$${transactionabs}** ${tostring} ${mention}'s balance!${additional}`;
				let denyreply = `The transaction to ${addstring} **$${transactionabs}** to ${mention}'s balance was cancelled!`;
				if (config.money.set.includes (args[1])) {
					startreply = `Are you sure you want to set ${mention}'s balance to **$${transactionabs}**?${additional}`;
					confirmreply = `You have set ${mention}'s balance to **${transactionabs}**!${additional}`
					denyreply = `The transaction to set ${mention}'s balance to **$${transactionabs}** was cancelled!`;
				}
				return message.reply (startreply).then(sentMessage => { // Confirmation message
					sentMessage.react ('👍'); // React
					const filter = (reaction, user) => { // Creates the filter for the collector
						return reaction.emoji.name == '👍' && user.id == message.author.id; // Author mentions thumbs up
					};
					const collector = sentMessage.createReactionCollector (filter, {time: config.autodelete.collector}); // Collector
					collector.on ('collect', (reaction, user) => { // Collected despite filter
						collector.stop ('transaction done'); // Reason so it won't activate an event
						db.add (`member.${mention.id}.money`, transaction)
						sentMessage.edit (`${message.author}, ` + confirmreply).then (sentMessage => replymessagelong(sentMessage));
						sentMessage.reactions.removeAll(). then(sentMessage.react ('✅'));
					});
					collector.on ('end', (collected, reason) => { // When it ends
						if (reason !== 'transaction done'){ // Only ends through nonresponsiveness
							sentMessage.edit (`${message.author}, ` + denyreply).then (sentMessage => replymessagelong(sentMessage));
							sentMessage.reactions.removeAll(). then(sentMessage.react ('❌'));
						}
					})
				})
			}
		}
		function replymessage (sentMessage) {
            sentMessage.delete({timeout: config.autodelete.sent});
			message.delete ({timeout: config.autodelete.received});
		}
		function replymessagelong (sentMessage) {
			sentMessage.delete ({timeout: config.autodelete.sentlong});
			message.delete ({timeout: config.autodelete.receivedlong})
		}
	}
};