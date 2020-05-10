module.exports = {
    name: 'money', // Name referred to execute
    description: 'Changing and adjusting currency values', // Description of file
	summoner: ['money', 'currency', 'economy', '$', 'cash'], // Things that activate this
    execute (message, args) {
// USERS -----------------------------------------------------------------------------------------------------------------------------------------------------------------
		let balance = db.get (`${message.author.id}.money`); // Get their money
		if (balance == null) { // If not already have money, get it
			db.set (`${message.author.id}.money`, 0); // Set money
			balance = db.get (`${message.author.id}.money`); // Get money again
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
			let balance = db.get (`${mention.id}.money`); // Get their money
			if (balance == null){ // If not already have money, get it
				db.set (`${mention.id}.money`, 0); // Set money
				balance = db.get (`${mention.id}.money`); // Get money again
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
				return message.reply ('There was an error, try using just `-money pay <mention> <amount> [additional]`').then (sentMessage => { // Shows correct syntax
					sentMessage.delete ({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
			}
			let mention = message.mentions.members.first(); // Gets the mentioned user
			let balance1 = db.get (`${mention.id}.money`); // Get their money
			if (balance1 == null) { // If not already have money, get it
				db.set (`${mention.id}.money`, 0); // Set money
				balance1 = db.get (`${mention.id}.money`); // Get money again
			}
			if (message.author.id == mention.id) {
				return message.reply ('You can\'t pay yourself, only other people').then (sentMessage => {
					sentMessage.delete ({timeout: config.autodelete.sent});
					message.delete ({timeout: config.autodelete.received});
				});
			}
			if (args[3])
			message.reply (`Are you sure you want to give **$${args[3]}** to ${mention}?`).then (sentMessage => {
				sentMessage.react ('👍')
				const filter = (reaction, user) => {
					return reaction.emoji.name === '👍' && user.id === message.author.id;
				};
				const confirmcollector = sentMessage.createReactionCollector(filter,{time: config.autodelete.collector});
				confirmcollector.on ('collect', (reaction, user) => {
					sentMessage.delete ();
					confirmcollector.stop ();
				});
			})
		}
	}
};