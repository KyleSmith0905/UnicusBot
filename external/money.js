const moneyConfig = config.commands.money;
const commandConfig = moneyConfig.arguments.command.inputs;
const actionInputConfig = moneyConfig.arguments.action.inputs;
const {randomColor, getUserInfo, currencyFormat} = require ('./functions');

module.exports = {
	name: 'money',
	summoner: moneyConfig.alias,
	cooldown: 1,
	async execute (message, args) {
		let member = message.member;
		const guild = message.channel.guild;
		let mention = message.mentions[0] || message.member;
		let userInfo = await getUserInfo (mention, guild);
		if (commandConfig.bal.includes(args[1])) {
			if ((args[2] && !args[2].match(/^<@!?(\d+)>$/)) || args[3]) return errorLog (message, args, 'money', 'invalidUsage', ['target']);
			const balance = currencyFormat(userInfo.money)
			let embed = {
				title: 'Money - Balance',
				color: randomColor ('white'),
				timestamp: new Date().toISOString(),
				description: ((mention.id == message.member.id) ? 'You have ' : 'They have ') + balance + ' in liquid assets.',
				fields: [
					{name: 'Member:', value: mention.mention, inline: true},
					{name: 'Money:', value: balance, inline: true},
				]
			}
			if (userInfo.experience > 0) embed.fields.push ({name: 'Experience:', value: userInfo.experience.toFixed(2), inline: true})
			message.channel.createMessage ({content: member.mention + ',', embed: embed})
		}
		else if (commandConfig.ast.includes(args[1])) {
			if ((args[2] && !args[2].match(/^<@!?(\d+)>$/)) || args[3]) return errorLog (message, args, 'money', 'invalidUsage', ['target']);
			let embed = {
				title: 'Money - Assets',
				color: randomColor ((userInfo.items.length == 0) ? 'orange' : ((userInfo.items.length >= 5) ? 'blue': 'white')),
				timestamp: new Date().toISOString(),
				description: ((mention.id == message.member.id) ? 'You have ' : 'They have ') + ((userInfo.items.length == 0) ? 'no' : userInfo.items.length) + ' long-term assets',
				fields: [
					{name: 'Member:', value: mention.mention, inline: true},
					{name: 'Assets:', value: ((userInfo.items.length == 0) ? '*No long-term assets*' : '`' + userInfo.items.join('`| `') +'`'), inline: true},
					{name: 'Liquid:', value: currencyFormat(userInfo.money), inline: true}
				]
			}
			message.channel.createMessage ({content: member.mention + ',', embed: embed})
		}
		else if (commandConfig.pay.includes(args[1])) {
			let transaction = (args[3]) ? args[3].replace (/[,$]/g, "") : null;
			let errors = ((mention && message.member.id == mention.id) || !args[2] || !args[2].match(/^<@!?(\d+)>$/)) ? ['target'] : [];
			if (!args[3] || isNaN(transaction) || args[3].includes ('.') || args[3] == 0 || (-1000000000 >= transaction || transaction >= 1000000000)) errors.push ('currency');
			if (errors.length) return errorLog (message, args, 'money', 'invalidUsage', errors);
			let userInfoSender = await getUserInfo (member, guild);
			if (transaction < 0) {
				transaction = Math.abs (transaction);
				const cloneSenderInfo = userInfoSender; const cloneSender = member;
				userInfoSender = userInfo; member = mention;
				userInfo = cloneSenderInfo; mention = cloneSender
			}
			if (transaction > userInfoSender.money || -transaction > userInfo.money) return errorLog (message, args, 'money', 'money', ['Payment', transaction, userInfoSender.money]);
			const paymentString = 'Payment of ' + toCurrencyFormat (Math.abs(transaction)) + ' from ' + member.mention + ' to ' + mention.mention + '.';
			let embed = {
				title: 'Money - Pay',
				color: randomColor ('white'),
				timestamp: new Date().toISOString(),
				description: 'Payment Pending: ' + paymentString,
				fields: [
					{name: 'Sender:', value: member.mention, inline: true},
					{name: 'Balance:', value: toCurrencyFormat (userInfoSender.money), inline: true},
					{name: 'Confirmation:', value: 'Pending', inline: true},
					{name: 'Receiver:', value: mention.mention, inline: true},
					{name: 'Balance:', value: toCurrencyFormat (userInfo.money), inline: true},
					{name: 'Confirmation:', value: 'Pending', inline: true}
				]
			}
			if (args[4]) embed.fields.push ({name: 'Description', value: message.content.substring(message.content.indexOf(args[4])), inline: false})
			const sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed})
			sentMessage.addReaction ('👍');
			const filter = (mes, emj, usr) => (emj.name == '👍') && (usr == member.id || usr == mention.id);
			const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
			let countSender; let countReceiver;
			collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
				if (userID == member.id && !countSender) {
					embed.fields[2] = {name: 'Confirmation:', value: 'Confirmed', inline: true};
					countSender = 1;
				}
				else if (userID == mention.id && !countReceiver) {
					embed.fields[5] = {name: 'Confirmation:', value: 'Confirmed', inline: true};
					countReceiver = 1
				}
				if (countReceiver && countSender) {
					collector.stop ('payment confirmed');
					embed.description = 'Payment Confirmed: ' + paymentString;
					embed.color = randomColor ('blue');
					embed.fields[1] = {name: 'Balance:', value: toCurrencyFormat (userInfoSender.money - transaction), inline: true};
					embed.fields[4] = {name: 'Balance:', value: toCurrencyFormat (userInfo.money + transaction), inline: true};
					setUserInfo (member, guild, 'money', 'add', transaction * -1,);
					setUserInfo (mention, guild, 'money', 'add', transaction);
				}
				sentMessage.edit ({content: member.mention + ',', embed: embed});
			});
			collector.on ('end', (collected, reason) => {
				sentMessage.removeReactions ()
				if (reason == 'payment confirmed') return;
				embed.color = randomColor ('orange');
				embed.description = 'Payment Cancelled: ' + paymentString;
				sentMessage.edit ({content: member.mention + ',', embed: embed});
			})
		}
		else if (commandConfig.adm.includes(args[1])) {
			const ownerRole = guild.roles.find (ele => ele.id == process.env.ROLE_OWNER)
			if (!member.roles.includes (ownerRole.id)) return errorLog (message, args, 'money', 'permission', [ownerRole]);
			let transaction = args[4].replace (/[,$]/g, '');
			let subcommand = Object.keys(actionInputConfig).find (ele => actionInputConfig[ele].alias.includes (args[2]))
			let errors = (!subcommand) ? ['admin'] : [];
			if (!args[3] || !args[3].match(/^<@!?(\d+)>$/)) errors.push ('target');
			if (args[4].includes ('.') || isNaN(transaction) || (-1000000000 >= transaction || transaction >= 1000000000)) errors.push ('currency')
			if (errors.length) return errorLog (message, args, 'money', 'invalidUsage', errors);
			let phrasePayment = 'deposited to';
			transaction = parseInt(transaction)
			const subcommandSet = (subcommand == 'set') ? true : false
			if (subcommand == 'set') {
				transaction = transaction - userInfo.money;
				subcommand = 'add';
			};
			if ((subcommand == 'remove' && transaction > 0) || (subcommand == 'add' && transaction < 0)) {
				phrasePayment = 'withdrawn from';
				if (subcommand == 'add' && transaction < 0) {
					transaction = Math.abs(transaction);
					subcommand = 'remove';
				};
			}
			else if (subcommand == 'remove' && transaction < 0) {
				transaction = Math.abs(transaction);
				subcommand = 'add';
			}
			const paymentString = ('Transfer of ' + toCurrencyFormat(Math.abs(transaction)) + ' ' + phrasePayment + ' ' + mention.mention + '.')
			let embed = {
				title: 'Money - Admin',
				color: randomColor ('white'),
				timestamp: new Date().toISOString(),
				description: 'Allocation Pending: ' + paymentString,
				fields: [
					{name: 'Receiver:', value: mention.mention, inline: true},
					{name: 'Balance:', value: toCurrencyFormat (userInfo.money), inline: true},
					{name: 'Result:', value: toCurrencyFormat ((subcommand == 'remove') ? userInfo.money - transaction : userInfo.money + transaction), inline: true}
				]
			};
			const sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
			sentMessage.addReaction ('👍');
			const filter = (mes, emj, usr) => (emj.name == '👍') && (usr == member.id);
			const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
			collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
				if (userID == member.id) {
					collector.stop ('confirmed');
					embed.description = 'Allocation Confirmed: ' + paymentString;
					embed.color = randomColor ('blue');
					embed.fields[1].name = 'Before';
					embed.fields[2].name = 'Balance';
					setUserInfo (mention, guild, 'money', (subcommandSet) ? 'set' : 'add' , (subcommandSet) ? args[4].replace (/,/g, "") : (subcommand == 'remove') ? transaction * -1 : transaction);
					sentMessage.edit ({embed})
				}
			})
			return collector.on ('end', (collected, reason) => {
				sentMessage.removeReactions();
				if (reason == 'confirmed') return
				embed.color == randomColor ('orange');
				embed.description = 'Allocation Cancelled: ' + paymentString;
				sentMessage.edit ({embed})
			})
		}
		else return errorLog (message, args, 'money', 'invalidUsage', ['command']);
	}
};

async function setUserInfo (member, guild, fieldInput, equation, value) {
	let userInfo = await getUserInfo (member, guild);
	let setValue = (equation == 'add') ? userInfo.money + value : value;
	if (fieldInput == 'money') userInfo.set ({money: setValue});
    userInfo.save ();
}

function toCurrencyFormat (number) {
	return ((parseFloat(number) < 0) ? '-' : '') + '$' + Math.round(Math.abs(number)).toLocaleString()
}