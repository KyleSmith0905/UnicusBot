module.exports = {
    name: 'money', // Name referred to execute
    description: 'Changing and adjusting currency values', // Description of file
	summoner: ['money', 'currency', 'economy', '$', 'cash'], // Things that activate this
    execute (message, args) {
// USERS -----------------------------------------------------------------------------------------------------------------------------------------------------------------
		let balance = db.get (`member.${message.author.id}.money`); // Get their money
		if (balance == null) { // If not already have money, get it
			db.set (`member.${message.author.id}.money`, 0); // Set money
			balance = db.get (`member.${message.author.id}.money`); // Get money again
		}
		// BALANCE -------------------------------------------------------------------------------------------------------------------------------------------------------
		if (config.money.balance.includes(args[1])) { // Asking for balance
			if (args[2] && (!args[2].match(/^<@!?(\d+)>$/) || args[3])) { // Checks if syntax was correct
				return message.reply ('There was an error, try using just `-money balance [mention]`').then (sentMessage => { //The message that was sent
					sentMessage.delete({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
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
			return message.reply (balancemessage).then (sentMessage => { // Sends the balance and deletes it later
				sentMessage.delete({timeout: config.autodelete.sentlong});
				message.delete ({timeout: config.autodelete.receivedlong});
			});
		} 
		// PAY -----------------------------------------------------------------------------------------------------------------------------------------------------------
		else if (config.money.pay.includes(args[1])) { // Paying someone else money, sharing basically
			if (!args[2] || !args[2].match(/^<@!?(\d+)>$/) || isNaN(args[3])) { // Checks if wrong syntax
				return message.reply ('There was an error, try using just `-money pay <mention> <amount> [additional]`!').then (sentMessage => { // Shows correct syntax
					sentMessage.delete ({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
			}
			let mention = message.mentions.members.first(); // Gets the mentioned user
			let additional = '' // Additional information for footer
			if (args[4]) {
				additional = message.content.substring(message.content.indexOf(args[4])); // Everything after agument 2
				additional2 = `\nReason for transaction: ${additional}`;
			}
			let balance1 = db.get (`member.${mention.id}.money`); // Get their money
			if (balance1 == null) { // If not already have money, get it
				db.set (`member.${mention.id}.money`, 0); // Set money
				balance1 = db.get (`member.${mention.id}.money`); // Get money again
			}
			if (message.author.id == mention.id) { // Giving money to yourself
				return message.reply ('You can\'t pay yourself, only other people!').then (sentMessage => {
					sentMessage.delete ({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
			}
			if (args[3] <= 0) { // Paying negative or zero money
				return message.reply ('A transaction can\'t be zero dollars or less').then (sentMessage => {
					sentMessage.delete ({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
			}
			if (args[3] > balance) { // Giving more than you have
				let difference = args[3] - balance
				return message.reply (`You currently have **$${balance}**, that is **$${difference}** less than the amount you are trying to give, **$${args[3]}**!`).then (sentMessage => {
					sentMessage.delete ({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
			}
			return message.reply (`Are you sure you want to give **$${args[3]}** to ${mention}?${additional2}`).then (sentMessage => { // Confirmation message
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
// ADMIN -----------------------------------------------------------------------------------------------------------------------------------------------------------------
		// PAY -----------------------------------------------------------------------------------------------------------------------------------------------------------
		else if (config.money.add.includes (args[1])) { // Add command (admin usage)
			if (message.author.id !== config.owner) { // Not an admin
				return message.reply ('You do not have permissions to use this command').then (sentMessage => { // Permissions Message
					sentMessage.delete ({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
			}
			else if (!args[2] || !args[2].match(/^<@!?(\d+)>$/) || isNaN(args[3])) { // Doesn't follow syntax
				return message.reply.reply ('There was an error, try using just `-money add <mention> <amount> [additional]`!').then (sentMessage => { // Shows correct syntax
					sentMessage.delete ({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
			}
			else {
				let additional = '' // Additional information for footer
				if (args[4]) {
					additional = message.content.substring(message.content.indexOf(args[4])); // Everything after agument 2
					additional = `\nReason for transaction: ${additional}`;
				}
				let mention = message.mentions.members.first(); // Gets the mentioned user
				return message.reply (`Are you sure you want to add **$${args[3]}** to ${mention}'s balance?${additional}`).then (sentMessage => { // Confirmation message
					sentMessage.react ('👍'); // React
					const filter = (reaction, user) => { // Creates the filter for the collector
						reaction.emoji.name == '👍' && user.id == message.author.id; // Author mentions thumbs up
					};
					const collector = sentMessage.createReactionCollector (filter, {time: config.autodelete.collector}); // Collector
					collector.on ('collect', (reaction, user) => { // Collected despite filter
						console.log ('working')
						sentMessage.delete (); // Delete
						collector.stop ('transaction done'); // Reason so it won't activate an event
						db.add (`member.${message.author.id}.money`, args[3])
						message.reply (`You have added ${args[3]} to **$${mention}**'s balance!${additional}`).then (sentMessage2 => { // Completed transaction message
							sentMessage2.delete ({timeout: config.autodelete.sentlong});
						});
					});
					collector.on ('end', (collected, reason) => { // When it ends
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
};