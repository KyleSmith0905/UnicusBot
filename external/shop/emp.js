module.exports = {
    name: 'emp', // Name referred to execute
    description: 'Make a channel secret and not shown in #all-states', // Description of file
    summoner: ['emp'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        let balance = db.get (`member.${message.author.id}.money`); // Get their money
        args[2] = args[2].replace (/,/g, ""); // Remove commas
        if (args[3]) args[3] = args[3].replace (/,/g, ""); // Remove commas
        let minute = args[2]; // Set 'minute'
        let hour = args[3] || 0; // Set 'hour'
        minute = parseInt (minute); // Turn this into an integer
        hour = parseInt (hour) // Turn this into an integer
        let totaltime = minute + (hour * 60); // Calculates total time
        let displaytime = `${Math.floor(totaltime / 60)}:${Math.floor(totaltime % 60)}:00` // Calculates time displayed
        let cost = Math.round(((balance) ** 0.6) + ((totaltime * 200) ** 0.5) + ((totaltime / 150) ** 3) + 50); // Calculates cost
        const empinventory = db.get (`member.${message.author.id}.abilities.emp`); // All EMP in abilities
        if (isNaN(args[2]) || !args[2] || (isNaN(args[3]) && args[3])) {
            return message.reply ('The command is `-shop emp <minutes> [hours] [optional]`').then (sentMessage => replymessage(sentMessage)); // Activate delete function
        }
        if (totaltime <= 5) {
            return message.reply ('You can\'t buy an EMP ability that lasts for five minutes or less').then (sentMessage => replymessage(sentMessage)); // Activate delete function
        }
        if (balance <= cost) {
            return message.reply (`This costs **$${cost}** to buy, you don't have enough money to buy it!`).then (sentMessage => replymessage(sentMessage)); // Activate delete function
        }
        return message.reply (`Are you sure you want to buy an EMP for **$${cost}**? It has a duration of ${displaytime}!`).then (sentMessage => { // Confirmation message
            sentMessage.react ('👍'); // React
            const filter = (reaction, user) => { // Creates the filter for the collector
                return reaction.emoji.name === '👍' && user.id === message.author.id; // Author mentions thumbs up
            };
            const confirmcollector = sentMessage.createReactionCollector(filter,{time: config.autodelete.collector}); // Collector
            confirmcollector.on ('collect', () => { // Collected despite filter
                confirmcollector.stop ('ability done'); // Reason so it won't activate an event
                let smallempnum = 1; // Minimum number
                let smallempinv = empinventory || 0; // Sets this smallempinv value from empinventory
                if (!Array.isArray(smallempinv)) smallempinv = [0, 0] // Creates a fake array so bottom things will work
                smallempinv.sort() // Sorts the array from small to high
                for (let num in smallempinv) if (smallempinv[num] > -1 && smallempinv[num] == smallempnum) smallempnum++; // Find lowest value 1 and above
                db.subtract (`member.${message.author.id}.money`, cost) // Removes the money from balance
                db.push (`member.${message.author.id}.abilities.emp`, smallempnum) // add the emp number to abilities
                db.set (`member.${message.author.id}.abilities.emp.${smallempnum}.time`, smallempnum) // Adds the time to it
                sentMessage.edit (`You have successfully bought an EMP for **$${cost}**! You now have ${empinventory.length + 1 || 1} EMP!\nTo activate the EMP, type \`-use emp ${smallempnum}\``)
                .then (sentMessage => replymessagelong(sentMessage));
            });
            confirmcollector.on ('end', (collected, reason) => { // When it ends
                if (reason !== 'ability done') sentMessage.edit (`You waited too long to confirm your purchase of an EMP!`)
                .then (sentMessage => replymessagelong(sentMessage));
            })
        })
        function replymessage (sentMessage) {
            sentMessage.delete({timeout: config.autodelete.sent});
            message.delete ({timeout: config.autodelete.received});
        }
        function replymessagelong (sentMessage) {
			sentMessage.delete ({timeout: config.autodelete.sentlong});
			message.delete ({timeout: config.autodelete.receivedlong})
		}
    }
}