const funConfig = config.commands.fun;
const commandConfig = funConfig.arguments.game.inputs;
const {randomColor, timeout, getUserInfo, currencyFormat} = require ('./functions');

module.exports = {
    name: 'fun',
    summoner: funConfig.alias,
    async execute (message, args) {
        let member = message.member;
        if (commandConfig.wyr.includes (args[1])) {
            let eitherAnswer;
            await fetch ('http://either.io/', {method: 'get'})
            .then (res => res.text())
            .then (body => eitherAnswer = body.split('window.initial_question')[1]);
            let option1Object = {
                name: eitherAnswer.split('n_1":"')[1].split('","opt')[0],
                number: parseInt(eitherAnswer.split('1_total":"')[1].split('"')[0]),
            }
            let option2Object = {
                name: eitherAnswer.split('n_2":"')[1].split('","opt')[0],
                number: parseInt(eitherAnswer.split('2_total":"')[1].split('"')[0]),
            }
            const totalNumber = option1Object.number + option2Object.number;
            option1Object.percent = 100 * option1Object.number / totalNumber;
            option2Object.percent = 100 * option2Object.number / totalNumber;
            const link = '(http://either.io/' + eitherAnswer.split('"id":"')[1].split('","liv')[0] + '/' + eitherAnswer.split('lug":"')[1].split('","pre')[0] + ')'
            const embed = {
                title: 'Fun - Either',
                color: randomColor ('all'),
                timestamp: new Date().toISOString(),
                description: '[Would you rather...]' + link + ' 🟦 **' + option1Object.name + '** 🟦 [or]' + link + ' 🟥 **' + option2Object.name + '** 🟥?',
                fields: [{name: 'Results:', value: '||**' + option1Object.name + '**| ' + option1Object.number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '| ' + option1Object.percent.toFixed() + '%\n **' + option2Object.name + '**| ' + option2Object.number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '| ' + option2Object.percent.toFixed() + '%||', inline: true}]
            }
            const sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
            sentMessage.addReaction ('🟦');
            sentMessage.addReaction ('🟥');
        }
        else if (commandConfig.gam.includes (args[1])) {
            let userInfo = await getUserInfo (member, message.channel.guild);
            let wagerString = (args[2]) ? args[2].replace (/[,$]/g, "") : null;
            let wagerFloat = parseFloat (wagerString);
            let oddsFloat = parseFloat (args[3] ? args[3] : 50);
            let winValue = wagerFloat * (-1+(100/oddsFloat))
            let errors = []
            if (isNaN(wagerFloat) || wagerFloat <= 0 || wagerFloat > 1000000000 || userInfo.money < wagerFloat) errors.push ('currency');
            if (isNaN(oddsFloat) || oddsFloat >= 100 || oddsFloat <= 0 || args[4]) errors.push ('odds')
            if (errors.length) return errorLog (message, args, 'fun', 'invalidUsage', errors);
            let embedStart = {
                title: 'Fun - Gamble',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'Are you sure you want to gamble ' + currencyFormat(wagerFloat) + '?',
                fields: [
                    {name: 'Gambler:', value: member.mention, inline: true},
                    {name: 'Winning:', value: oddsFloat.toFixed() + '% chance of winning ' + currencyFormat(winValue), inline: true},
                    {name: 'Losing:', value: (100-oddsFloat).toFixed() + '% chance of losing ' + currencyFormat(wagerFloat), inline: true}
                ]
            }
            let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embedStart});
            sentMessage.addReaction ('👍');
			const filter = (mes, emj, usr) => emj.name == '👍' && usr == member.id;
			const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
			collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                let random = Math.random() * 100;
                userInfo = await getUserInfo (member, message.channel.guild);
                if (oddsFloat > random) {
                    embedStart.description = 'Luck was on your side, you won ' + currencyFormat(winValue) + ' from gambling.';
                    embedStart.color = randomColor ('blue');
                    userInfo.money = userInfo.money + winValue;
                }
                else {
                    embedStart.description = 'Luck was not on your side, you lost' + currencyFormat(wagerFloat) + ' from gambling.';
                    embedStart.color = randomColor ('orange');
                    userInfo.money = userInfo.money - wagerFloat;
                }
                sentMessage.edit ({content: member.mention + ',', embed: embedStart});
                userInfo.save()
                collector.stop('stopped')
            })
            collector.on ('end', (collected, reason) => {
                if (reason == 'stopped') return;
                embedStart.description = 'Your gambling request was cancelled because you took too long to respond.';
                embedStart.color = randomColor ('orange');
                sentMessage.edit ({content: member.mention + ',', embed: embedStart});
            })
        }
        else if (commandConfig.pic.includes (args[1])) {
            let embedStart = {
                title: 'Fun - Pictionary',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'One randomly selected player will secretly be given a random topic. The rest of the players will attempt to guess the topic. React with 👍 to play.',
                fields: [
                    {name: 'Players', value: '3-12 players', inline: true},
                    {name: 'Length', value: '2 Minutes', inline: true},
                    {name: 'Options', value: 'None', inline: true}
                ]
            }
            let lobbyMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embedStart});
            gameLobby (lobbyMessage, embedStart, 'Pictionary', member.mention, 3, 12, pictionary);
        }
        else if (commandConfig.dec.includes (args[1])) {
            let gameOption = {};
            if (args[2]) {
                const index = message.content.toLowerCase().indexOf(args[2]);
                const settings = message.content.substring(0, message.content.length - 1).slice(index).replace (/\[n]/g, '\n');
                const settingsSplit = settings.split ('`| ');
                const settingsConfig = funConfig.arguments.deceptionSettings.inputs;
                settingsSplit.forEach (ele => {
                    let eleSplit = ele.split(/: ?`/);
                    let backTickNumber = (eleSplit[1].split('`').length - 1);
                    if (!eleSplit [1] || eleSplit[2] || 1 == backTickNumber % 2);
                    else if (settingsConfig.wgr.includes (eleSplit[0]) && Boolean(eleSplit[1].match(/^\d+$/g))) return gameOption.wager = parseFloat(eleSplit[1]);
                    return error = true;
                })
            }
            if (gameOption.error) return errorLog (message, args, 'Fun', 'invalidUsage', ['deceptionSettings']);
            if (!gameOption.wager) gameOption.wager = 0;
            let embedStart = {
                title: 'Fun - Deception',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'One randomly selected player will prove their deceptive abilities through the means of justifying.' + ((gameOption.wager > 0) ? '\n**ATTENTION:** This game is a wager match, it will cost $' + gameOption.wager + ' to enter.' : ''),
                fields: [
                    {name: 'Players', value: '3-8 players', inline: true},
                    {name: 'Length', value: '8 Minutes', inline: true},
                    {name: 'Options', value: 'Wager: `$' + gameOption.wager + '`', inline: true}
                ]
            }
            let lobbyMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embedStart});
            gameLobby (lobbyMessage, embedStart, 'Deception', member.mention, 1, 8, deceptionStarter, gameOption);
        }
        else if (commandConfig.rdl.includes (args[1])) {
            let riddleAnswer;
            await fetch ('https://fungenerators.com/random/riddle', {method: 'get'})
            .then (res => res.text())
            .then (body => riddleAnswer = body.split('<h2 class="')[1].split('<p class="wow')[0]);
            const embed = {
                title: 'Fun - Riddle',
                color: randomColor ('all'),
                timestamp: new Date().toISOString(),
                description: riddleAnswer.split('">')[1].split('</h2>')[0],
                fields: [{name: 'Answer:', value: '||' + riddleAnswer.split('<div class="">')[1].split('</div>')[0] + '||', inline: false}]
            }
            message.channel.createMessage ({content: member.mention + ',', embed: embed});
        }
        else if (commandConfig.chs.includes (args[1])) {
            let gameOption = {
                extra: {
                    kingWhite: true,
                    kingBlack: true
                }
            }; 
            if (args[2]) {
                const index = message.content.toLowerCase().indexOf(args[2]);
                const settings = message.content.substring(0, message.content.length - 1).slice(index).replace (/\[n]/g, '\n');
                const settingsSplit = settings.split ('`| ');
                const settingsConfig = funConfig.arguments.chessSettings.inputs;
                for (let i = 0; i < settingsSplit.length; i++) {
                    let eleSplit = settingsSplit[i].split(/: ?`/);
                    let backTickNumber = (eleSplit[1].split('`').length - 1);
                    if (!eleSplit [1] || eleSplit[2] || 1 == backTickNumber % 2);
                    else if (settingsConfig.wgr.includes (eleSplit[0]) && Boolean(eleSplit[1].match(/^\d+$/g))) gameOption.wager = parseFloat(eleSplit[1]);
                    else if (settingsConfig.sty.includes (eleSplit[0])) gameOption.style = eleSplit[1];
                    else if (settingsConfig.lyt.includes (eleSplit[0])) gameOption.layout = eleSplit[1];
                    else {gameOption.error = true; break}
                }
            }
            if (gameOption.error) return errorLog (message, args, 'Fun', 'invalidUsage', ['chessSettings']);
            if (!gameOption.style) gameOption.style = 'nrm';
            gameOption.style = Object.keys(funConfig.arguments.chessStyle.inputs).find(ele => funConfig.arguments.chessStyle.inputs[ele].includes(gameOption.style));
            if (!gameOption.style) return errorLog (message, args, 'Fun', 'invalidUsage', ['chessStyle']);
            if (!gameOption.layout) gameOption.layout = 'nrm';
            gameOption.layout = Object.keys(funConfig.arguments.chessLayout.inputs).find(ele => funConfig.arguments.chessLayout.inputs[ele].includes(gameOption.layout));
            if (!gameOption.layout) return errorLog (message, args, 'Fun', 'invalidUsage', ['chessLayout']);
            if (!gameOption.wager) gameOption.wager = 0;
            let embedStart = {
                title: 'Fun - Chess',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'The classic game of chess. A two player game of strategy with a steady learning curve.' + (gameOption.wager > 0 ? '\n**ATTENTION:** This game is a wager match, it will cost $' + gameOption.wager + ' to enter.' : ''),
                fields: [
                    {name: 'Players:', value: '2 players', inline: true},
                    {name: 'Length:', value: '12 Minutes', inline: true},
                    {name: 'Options:', value: 'Wager: `$' + gameOption.wager + '`| Style: `'+ gameOption.style +'`| Layout: `' + gameOption.layout + '`', inline: true}
                ]
            }
            let lobbyMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embedStart});
            gameLobby (lobbyMessage, embedStart, 'Chess', member.mention, 2, 2, chessStarter, gameOption);
        }
        else return errorLog (message, args, 'Fun', 'invalidUsage', ['game']);
    }
}

async function gameLobby (sentMessage, sentEmbed, gameName, host, minPlayers, maxPlayers, gameFunction, gameOption) {
    sentMessage.addReaction ('👍');
    let startID = 0;
    const filter = (mes, emj, usr) => emj.name == '👍' && mes.reactions['👍'].count == minPlayers + 1;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 600000});
    collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
        startID++;
        let compareID = startID;
        setTimeout(async () => {
            if (compareID != startID) return;
            let messageReaction = await sentMessage.channel.getMessageReaction(sentMessage.id, '👍', maxPlayers + 1);
            let userInfoPromise = new Promise (async (resolve) => {
                if (!gameOption.wager) return resolve();
                for (let i = 0; i < messageReaction.length; i++) {
                    let userInfo = await getUserInfo(messageReaction[i].id, sentMessage.channel.guild.id);
                    messageReaction[i].userInfo = userInfo
                    if (i == messageReaction.length-1) resolve();
                }
            })
            userInfoPromise.then (() => {
                messageReaction = messageReaction.filter ((ele, i) => !ele.bot && (!gameOption.wager || ele.userInfo.money >= gameOption.wager));
                if (messageReaction.length < minPlayers) return;
                if (messageReaction.length > maxPlayers) messageReaction.pop();
                collector.stop ('started');
                if (gameOption.wager) {
                    for (let i = 0; i < messageReaction.length; i++) {
                        messageReaction[i].userInfo.money = messageReaction[i].userInfo.money - gameOption.wager;
                        messageReaction[i].userInfo.save();
                    }
                }
                gameFunction (sentMessage, messageReaction, gameOption);
            })
        }, 3000);
    })
    collector.on ('end', (collected, reason) => {
        if (reason == 'started') return;
        sentEmbed.fields.push ({name: 'Game Cancelled', value: gameName + ' won\'t start with fewer than ' + minPlayers + ' players.', inline: false});
        sentEmbed.color = randomColor ('orange');
        sentMessage.edit ({content: host + ',', embed: sentEmbed});
    })
}

async function pictionary (startMessage, startPlayers) {
    let playerMentions = '';
    startPlayers.forEach(ele => playerMentions = playerMentions + ele.mention);
    let canvas = [['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛']];
    const decimal = config.discordInfo.emoji.numbers;
    const letters = config.discordInfo.emoji.letters.slice(0, 16);
    let editedCanvas = [];
    for (i = 0; i < 10; i++) {
        editedCanvas.push(decimal[i] + canvas[i].join(''));
    }
    const artist = startPlayers[Math.floor(Math.random() * startPlayers.length)];
    const artistChannel = await client.getDMChannel(artist.id);
    const topic = funConfig.arguments.constants.randomWords [Math.floor(Math.random() * 453)];
    const artistEmbed = {
        title: 'Fun - Pictionary',
        color: randomColor ('white'),
        timestamp: new Date().toISOString(),
        description: 'You are the artist for this round. Your drawing topic is: __' + topic.toUpperCase() + '__',
    }
    artistChannel.createMessage ({content: artist.mention + ',', embed: artistEmbed});
    let embedGame = {
        title: 'Fun - Pictionary',
        color: randomColor ('blue'),
        timestamp: new Date().toISOString(),
        fields: [
            {name: 'Artist:', value: 'Type `draw <A-P> <0-9> [emoji]` to draw.', inline: true},
            {name: 'Audience:', value: 'Type `guess <word>` to guess.', inline: true},
            {name: 'Canvas', value: '⏺️' + letters.join('') + '\n' + editedCanvas.join('\n'), inline: false}
        ]
    }
    await timeout (1000)
    let sentMessage = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedGame});
    setTimeout (() => {
        if (embedGame.fields.length == 2) return;
        embedGame.color = randomColor ('white');
        sentMessage.edit ({content: playerMentions + ',', embed: embedGame});
    }, 90000)
    let defaultEmoji = '⬜';
    const filter = (mes) => startPlayers.find(ele => ele.id == mes.author.id);
    const collector = new messageCollector (client, sentMessage.channel, filter, {time: 120000});
    collector.on ('collect', async (messageReceiver) => {
        if (messageReceiver.author.id == artist.id) {
            if (!messageReceiver.content.startsWith('draw ') || (!messageReceiver.content.match(/[^\p{L}\p{N}\p{P}\p{Z}]/gu) && messageReceiver.content[9]) || messageReceiver.content[6] != ' ' || (messageReceiver.content[8] && messageReceiver.content[8] != ' ')) return;
            const xValue = parseInt(messageReceiver.content[5].toLowerCase().charCodeAt(0)-97);
            const yValue = parseInt(messageReceiver.content[7]);
            const zValue = messageReceiver.content.substring(9, 11) || defaultEmoji;
            if (isNaN(xValue) || isNaN(yValue) || !zValue) return;
            canvas[yValue][xValue] = zValue;
            defaultEmoji = zValue;
            let editedCanvas = [];
            for (i = 0; i < 10; i++) {
                editedCanvas.push(decimal[i] + canvas[i].join(''));
            }
            embedGame.fields[2].value = '⏺️' + letters.join('') + '\n' + editedCanvas.join('\n');
        }
        else {
            if (!messageReceiver.content.startsWith('guess ') || messageReceiver.content.substring(6).toLowerCase() != topic) return;
            embedGame.fields[1] = {name: 'Game Finished', value: 'The player, ' + messageReceiver.member.mention + ', guessed the word correctly: __' + topic.toUpperCase() + '__', inline: false}
            embedGame.color = randomColor ('blue');
            collector.stop('won')
        }
        sentMessage.edit ({content: playerMentions + ',', embed: embedGame});
    })
    collector.on ('end', async (collected, reason) => {
        if (reason != 'won') {
            embedGame.fields[1] = {name: 'Game Finished', value: 'No one guessed the topic of the drawing correctly: __' + topic.toUpperCase() + '__', inline: false}
            embedGame.color = randomColor ('orange');
        }
        embedGame.fields.shift();
        sentMessage.edit ({content: playerMentions + ',', embed: embedGame});
        setTimeout (async () => {
            let embedStart = {
                title: 'Fun - Pictionary',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'Regathering players for another match of pictionary. The artist and topic are randomly swapped in every match.',
                fields: [
                    {name: 'Players', value: '3-10 players', inline: true},
                    {name: 'Length', value: '2 Minutes', inline: true},
                    {name: 'Options', value: 'None', inline: true}
                ]
            }
            let lobbyMessage = await sentMessage.channel.createMessage ({content: playerMentions + ',', embed: embedStart});
            return gameLobby (lobbyMessage, embedStart, 'Pictionary', playerMentions, 3, 12, pictionary);
        }, 5000)
    })
}

async function deceptionStarter (startMessage, startPlayers, gameOption) {
    let playerMentions = '';
    startPlayers.forEach(ele => playerMentions = playerMentions + ele.mention);
    let colors = ['⚪​', '🟤', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣']
    let embedGame = {
        title: 'Fun - Deception',
        color: randomColor ('blue'),
        timestamp: new Date().toISOString(),
        description: 'All players will be privately messaged the prompt.',
        fields: [
            {name: 'How To Play:', value: 'All players that are not the spy has been messaged a word (as a prompt). All players will attempt to place their dot in a location that best represents the prompt. Players will be required to justify their response to others all the while they\'re trying find the spy.', inline: false}
        ]
    }
    const spyIndex = Math.floor(Math.random() * startPlayers.length)
    let playerPromise = new Promise ((resolve) => {
        startPlayers.forEach (async (ele, i) => {
            let colorsExtract = Math.floor(Math.random() * colors.length);
            startPlayers[i].color = colors[colorsExtract];
            colors.splice(colorsExtract, 1);
            startPlayers[i].privateChannel = await client.getDMChannel(ele.id);
            startPlayers[i].extra = Math.floor(Math.random() * 4);
            startPlayers[i].alive = true;
            startPlayers[i].spy = (spyIndex == i);
            if (i == startPlayers.length - 1) resolve();
        })
    })
    playerPromise.then (async () => {
        let helpMessage = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedGame});
        return deceptionRound (helpMessage, startPlayers, embedGame, gameOption)
    })
}

async function deceptionRound (startMessage, startPlayers, startEmbed, gameOption) {
    const topic = funConfig.arguments.constants.questions [Math.floor(Math.random()*funConfig.arguments.constants.questions.length)];
    let currentPlayers = 0;
    startPlayers.forEach (ele => {if (ele.alive == true) currentPlayers++});
    const totalValue = startPlayers.length*2;
    const exponentValue = totalValue**10;
    let canvas = '';
    for (let i = 0; i < 15; i++) {
        canvas = canvas + Math.floor(Math.random()*exponentValue).toString(totalValue).padStart(10, '0');
    }
    for (let i = 0; i < totalValue; i++) {
        if (i < totalValue-currentPlayers+1) canvas = canvas.split(i.toString(totalValue)).join('🌫️');
        else canvas = canvas.split(i.toString(totalValue)).join('⬛​​');
    }
    const decimal = config.discordInfo.emoji.numbers;
    const letters = config.discordInfo.emoji.letters.slice(0, 10);
    startPlayers.forEach(async (ele, i) => {
        if (ele.alive == false) return;
        const startIndex = 3*Math.floor(Math.random()*50);
        if (!ele.privateChannel) startPlayers[i].privateChannel = await client.getDMChannel(ele.id);
        let editedCanvas = [];
        for (let i2 = 0; i2 < 10; i2++) {
            editedCanvas.push(decimal[i2] + canvas.substring(i2*30+startIndex, i2*30+startIndex+30) + '​​');
        }
        let embedPrompt = {
            title: 'Fun - Deception',
            color: randomColor ('white'),
            timestamp: new Date().toISOString(),
            description: 'Type `place <A-J> <0-9>` to place your dot. Fogged areas are unplacable.' + (ele.spy ? ' As a spy, you are uninformed of the prompt.' : ''),
            fields: [
                {name: 'Color:', value: ele.color, inline: true},
                {name: 'Extra Dots:', value: ele.extra, inline: true},
                {name: 'Prompt:', value: (ele.spy ? 'You\'re the spy' : topic.charAt(0).toUpperCase() + topic.slice(1)), inline: true},
                {name: 'Gameboard:', value: '⏺️' + letters.join('') + '\n' + editedCanvas.join('\n'), inline: false}
            ]
        }
        let messagePrompt; let errorOccur = false;
        try {messagePrompt = await ele.privateChannel.createMessage ({content: ele.mention + ',', embed: embedPrompt})}
        catch {
            errorOccur = true;
            startEmbed.fields.push({name: 'Reference Error:', value: 'The bot was unable to message the DMs of ' + ele.username + ', their movements will be randomly assigned this round.', inline: false})
            startMessage.edit({content: startMessage.content, embed: startEmbed})
        }
        startPlayers[i].move = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
        if (errorOccur) return;
        let finishedMove = false;
        let filter = (msg) => msg.content.startsWith('place ');
        const collector = new messageCollector (client, ele.privateChannel, filter, {time: 60000});
        collector.on ('collect', async (messageReceiver) => {
            if (messageReceiver.content[9] || messageReceiver.content[7] != ' ') return;
            const xValue = parseInt(messageReceiver.content[6].toLowerCase().charCodeAt(0)-97);
            const yValue = parseInt(messageReceiver.content[8]);
            if (isNaN(xValue) || isNaN(yValue) || xValue>9 || xValue<0 || editedCanvas[yValue].slice(3*xValue-32, 3*xValue-29) != '⬛​​') return;
            if (finishedMove == true) {
                ele.extra = ele.extra - 1;
                startPlayers[i].move.push (xValue, yValue);
                embedPrompt.fields[1].value = ele.extra
            }
            else startPlayers[i].move = [xValue, yValue];
            editedCanvas[yValue] = editedCanvas[yValue].slice(0, 3*xValue-32) + ele.color + '​' + editedCanvas[yValue].slice(3*xValue-29);
            embedPrompt.fields[3].value = '⏺️' + letters.join('') + '\n' + editedCanvas.join('\n');
            embedPrompt.description = 'You successfully placed your dot. ' + ((ele.extra > 0) ? 'You could place extra dots to better clear your name.' : 'Please wait till the time limit is reached.');
            messagePrompt.edit ({content: ele.mention + ',', embed: embedPrompt});
            finishedMove = true;
            if (ele.extra <= 0) collector.stop();
        })
        setTimeout (() => {
            embedPrompt.color = randomColor ('orange');
            messagePrompt.edit ({content: ele.mention + ',', embed: embedPrompt});
        }, 30000)
    })
    setTimeout (async () => {
        canvas = canvas = canvas.split('🌫️').join('⬛​​') + '​​';
        startPlayers.sort ((a, b) => a.yValue*10+a.xValue - b.yValue*10+b.xValue);
        let outerLayers = []; let playerColors = ''; let emojiArray = []; let userIDArray = [];
        startPlayers.forEach (ele => {
            if (ele.alive == false) return;
            playerColors = playerColors + ele.color + ' `' + ele.username + '`| ';
            emojiArray.push(ele.color);
            userIDArray.push(ele.id);
            for (let i2 = 0; i2 < ele.move.length/2; i2++) {
                const arrayValue = ele.move[i2*2]*3+ele.move[i2*2+1]*30;
                const chartValue = canvas.substring(arrayValue, arrayValue+3);
                if (chartValue == '⬛​​') {
                    canvas = canvas.substring(0, arrayValue) + ele.color + '​' + canvas.substring(arrayValue+3);
                }
                else if (chartValue == '❇️​') outerLayers[outerLayers.length-1].colors.push(ele.color);
                else {
                    outerLayers.push({colors: [chartValue, ele.color], yValue: ele.move[i2*2+1]});
                    canvas = canvas.substring(0, arrayValue) + '❇️​' + canvas.substring(arrayValue+3);
                }
            }
        })
        let editedCanvas = []
        for (i = 0; i < 10; i++) {
            editedCanvas.push(canvas.slice(i*30,(i+1)*30));
        }
        outerLayers.forEach((ele, i) => {editedCanvas[ele.yValue] = editedCanvas[ele.yValue] + ' ｜ ' + ele.colors.join('')});
        let playerMentions = '';
        startPlayers.forEach(ele => {if (ele.alive == true) playerMentions = playerMentions + ' ' + ele.mention});
        let embedDeduce = {
            title: 'Fun - Deception',
            color: randomColor ('blue'),
            timestamp: new Date().toISOString(),
            description: 'The prompt was: **' + topic.charAt(0).toUpperCase() + topic.slice(1) + '**. Vote who you believe placed dots that worst represent the prompt.',
            fields: [
                {name: 'Players:', value: playerColors.slice(0,-2), inline: false},
                {name: 'Gameboard:', value: editedCanvas.join('\n'), inline: false}
            ]
        }
        let messageDeduce = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedDeduce});
        setTimeout (() => {
            embedDeduce.color = randomColor ('white');
            messageDeduce.edit ({content: playerMentions + ',', embed: embedDeduce});
        }, 60000)
        setTimeout (() => {
            embedDeduce.color = randomColor ('orange');
            messageDeduce.edit ({content: playerMentions + ',', embed: embedDeduce});
        }, 120000)
        emojiArray.forEach (ele => {
            messageDeduce.addReaction(ele)
        })
        const filter = (msg, emj, usr) => usr != client.user.id;
        const collector = new reactionCollector (client, messageDeduce, filter, {time: 155000});
        collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
            if (!emojiArray.includes(emoji.name)) messageDeduce.removeReactionEmoji (emoji.name);
            else if (!userIDArray.includes(userID)) messageDeduce.removeReaction (emoji.name, userID);
        })
        let tieBroken = false;
        let removalIndex = 0;
        setTimeout (async () => {
            messageDeduce = await startMessage.channel.getMessage(messageDeduce.id)
            let messageReaction = messageDeduce.reactions;
            let reactionArray = []
            Object.keys(messageReaction).forEach ((ele, i) => {
                if (!emojiArray.includes(ele)) return;
                reactionArray.push ({name: ele, count: messageReaction[ele].count})
            })
            reactionArray.sort((a, b) => b.count - a.count);
            if (reactionArray[1] && reactionArray[0].count == reactionArray[1].count) {
                tieBroken = true
                reactionArray[0] = reactionArray[Math.floor(Math.random() * reactionArray.length)]
            }
            removalIndex = startPlayers.findIndex((ele) => ele.color == reactionArray[0].name);
            startPlayers[removalIndex].alive = false;
            let embedResults = {
                title: 'Fun - Deception',
                color: randomColor ((startPlayers[removalIndex].spy || emojiArray.length <= 3) ? 'white' : 'orange'),
                timestamp: new Date().toISOString(),
                description: 'The player **' + startPlayers[removalIndex].username + '** was ' + (tieBroken ? 'randomly voted off due to indecisive results' : 'voted off') + ', they were ' + (startPlayers[removalIndex].spy ? '' : 'not') + 'the spy. ' + (emojiArray <= 3 ? 'The spy wins due to low amount of innocents left. ' : '') + ((startPlayers[removalIndex].spy || emojiArray.length <= 3) ? 'React to this message to play deception again with another randomly chosen spy.' : ''),
                fields: [
                    {name: 'Players', value: '3-8 players', inline: true},
                    {name: 'Length', value: '8 Minutes', inline: true},
                    {name: 'Options', value: 'None', inline: true}
                ]
            }
            const messageResults = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedResults});
            if (startPlayers[removalIndex].spy || emojiArray.length <= 3) {
                if (gameOption.wager > 0) {
                    startPlayers.forEach (async ele => {
                        let userInfo = await getUserInfo(ele.id, startMessage.channel.guild.id);
                        if (startPlayers[removalIndex].spy && ele.alive) userInfo.money = userInfo.money + gameOption.wager * (startPlayers.length / currentPlayers);
                        else if (!startPlayers[removalIndex].spy && ele.spy) userInfo.money = userInfo.money + gameOption.wager * currentPlayers;
                        userInfo.save();
                    })
                }
                return gameLobby (messageResults, embedResults, 'Deception', playerMentions, 3, 8, deceptionStarter)
            }
            else return deceptionRound (startMessage.channel, startPlayers, gameOption)
        }, 150000)
    }, 60000)
}

async function chessStarter (startMessage, startPlayers, gameOption) {
    let board;
    let turn = Math.floor(Math.random() * 2);
    if (turn == 1) startPlayers = [startPlayers[1], startPlayers[0]];
    let playerMentions = startPlayers[0].mention + ' ' + startPlayers[1].mention;
    switch (gameOption.layout) {
        case 'Normal': board = ['ecdfgdce','bbbbbbbb','AaAaAaAa','aAaAaAaA','AaAaAaAa','aAaAaAaA','BBBBBBBB','ECDFGDCE']; break;
        case 'Chess960': {
            let chessLayout = '';
            let chessPieces = ['c','c','d','d','e','e','f','g'];
            for (let i = 8; i > 0; i--) {
                let pieceNumber = Math.floor(Math.random() * i);
                chessLayout = chessLayout + chessPieces[pieceNumber];
                chessPieces.splice(pieceNumber, 1);
            }
            board = [chessLayout,'bbbbbbbb','AaAaAaAa','aAaAaAaA','AaAaAaAa','aAaAaAaA','BBBBBBBB',chessLayout.toUpperCase()]
            break;
        }
        case 'Transcendental': {
            let chessLayout = ['',''];
            for (let index = 0; index < 2; index++) {
                let chessPieces = ['c','c','d','d','e','e','f','g'];
                for (let i = 8; i > 0; i--) {
                    let pieceNumber = Math.floor(Math.random() * i);
                    chessLayout[index] = chessLayout[index] + chessPieces[pieceNumber];
                    chessPieces.splice(pieceNumber, 1);
                }
            }
            board = [chessLayout[0],'bbbbbbbb','AaAaAaAa','aAaAaAaA','AaAaAaAa','aAaAaAaA','BBBBBBBB',chessLayout[1].toUpperCase()]
            break;
        }
        case 'Really Bad Chess': {
            let chessLayout = ['','','',''];
            let chessPieces = ['b','c','d','e','f'];
            for (let index = 0; index < 4; index++) {
                for (let i = 0; i < 8; i++) {
                    if ((index == 0 || index == 3) && i == 4) chessLayout[index] = chessLayout[index] + 'g';
                    else chessLayout[index] = chessLayout[index] + chessPieces[Math.floor(Math.random() * 5)];
                }
            }
            board = [chessLayout[0],chessLayout[1],'AaAaAaAa','aAaAaAaA','AaAaAaAa','aAaAaAaA',chessLayout[2].toUpperCase(),chessLayout[3].toUpperCase()]
            break;
        }
        case 'Pre-Chess': {
            if (gameOption.extra?.board) {
                board = gameOption.extra.board;
                gameOption.extra.board = null;
                gameOption.extra.placePieces = null;
            }
            else {
                let chessBoard = ['HhHhHhHh','bbbbbbbb','AaAaAaAa','aAaAaAaA','AaAaAaAa','aAaAaAaA','BBBBBBBB','hHhHhHhH'];
                let embedGame = {
                    title: 'Fun - Chess',
                    color: randomColor ('blue'),
                    timestamp: new Date().toISOString(),
                    fields: [
                        {name: 'What to Do:', value: 'In the pre-chess variant both players take turns placing their pieces behind pawns before fighting. Use `place <piece><x>` (like: `place Qa`) to place a piece. You must use 2 rooks, 2 bishops, 2 knights, a queen and a king. ' + startPlayers[1].mention + ' will go first as white.', inline: false},
                        {name: 'Chess Board:', value: lettersToChess(chessBoard, 1, gameOption), inline: false},
                    ]
                }
                gameOption.extra.placePieces = ['KQRRBBNN','KQRRBBNN'];
                let message = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedGame});
                return chessSelect(message,chessBoard,1,startPlayers,gameOption);
            }
            break;
        }
        case 'Upside-Down': board = ['ECDFGDCE','BBBBBBBB','AaAaAaAa','aAaAaAaA','AaAaAaAa','aAaAaAaA','bbbbbbbb','ecdfgdce']; break;
        case 'Horde': {
            board = ['bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb','AbbaAbba','aAaAaAaA','BBBBBBBB','ECDFGDCE'];
            gameOption.extra.kingWhite = false;
            break;
        }
    }
    let embedGame = {
        title: 'Fun - Chess',
        color: randomColor ('blue'),
        timestamp: new Date().toISOString(),
        fields: [
            {name: 'How to Move:', value: 'Use algebraic notation to interact with the chess board through text commands.', inline: false},
            {name: 'Notation Resources:', value: '[FIDE Handbook](https://handbook.fide.com/chapter/E012018)', inline: true},
            {name: '\u200b', value: '[Notation Cheat Sheet](https://cheatography.com/davechild/cheat-sheets/chess-algebraic-notation/)', inline: true},
            {name: '\u200b', value: '[Notation Trainer](https://mattjliu.github.io/Notation-Trainer/#/practice)', inline: true},
            {name: 'Turn:', value: 'It is ' + startPlayers[0].mention + '\'s turn to move. Use `move <notation>` to move as white.', inline: false},
        ]
    }
    let message;
    if (gameOption.style == 'Image') {
        const image = await chessImage (board, 0);
        embedGame.image = {url: 'attachment://image.png'};
        message = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedGame}, {file: image.toBuffer(), name: 'image.png'});
    }
    else {
        embedGame.fields.push({name: 'Chess Board:', value: lettersToChess(board, 1, gameOption), inline: false}),
        message = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedGame});
    }
    chessRound (message, startPlayers, board, 1, gameOption)
}

function chessRound (startMessage, startPlayers, backupBoard, playerTurn, gameOption) {
    let errorMessage = [];
    playerTurn = -playerTurn + 1;
    const turnOffset = playerTurn * -32;
    let filter = (msg) => msg.content.toLowerCase().startsWith('move ') && msg.author.id == startPlayers[playerTurn].id && msg.content.length < 20;
    const collector = new messageCollector (client, startMessage.channel, filter, {time: 120000});
    collector.on ('collect', async (msgReceived) => {
        let chessBoard = [...backupBoard];
        const notation = msgReceived.content.substring(5);
        const notationObject = {};
        const pieceNotation = ['N','B','R','Q','K'];
        if (notation.substring (0,3) == '0-0'){
            let stringIndex;
            if (notation.startsWith ('0-0-0')) {
                notationObject.piece = '0Q';
                stringIndex = 5;
            }
            else if (notation.startsWith('0-0')) {
                notationObject.piece = '0K';
                stringIndex = 3;
            }
            if (notation[stringIndex] == '#') {
                notationObject.threat = 'chessmate';
                stringIndex++;
            }
            else if (notation[stringIndex] == '+') {
                notationObject.threat = 'check';
                stringIndex++;
            }
            const annotation = notation.substring(stringIndex, notation.length);
            const annotationList = {'!': 'a good move', '!!': 'a brilliant move', '!?': 'an interesting move', '?!': 'a dubious move', '??': 'a blunder', '?': 'a mistake'};
            if (Object.keys(annotationList).includes(annotation)) notationObject.move = annotationList[annotation]
            else if (annotation) {
                notationObject.error = 'suffix'
            }
        }
        else {
            for (let i = notation.length - 1; i > 0; i--) {
                if (!notationObject.y && notation[i].charCodeAt(0) >= 49 && notation[i].charCodeAt(0) <= 56 && notation[i - 1].charCodeAt(0) >= 97 && notation[i - 1].charCodeAt(0) <= 104) {
                    notationObject.y = parseFloat(notation[i])-1;
                    notationObject.x = notation[i-1].charCodeAt(0)-97;
                    let stringIndex = i + 1
                    if (notation[stringIndex] == '=' && pieceNotation.includes(notation[stringIndex + 1]) && notation[stringIndex + 1] != 'K') {
                        notationObject.promote = notation[stringIndex + 1];
                        stringIndex += 2;
                    }
                    if (notation[stringIndex] == '#') {
                        notationObject.threat = 'chessmate';
                        stringIndex++;
                    }
                    else if (notation[stringIndex] == '+') {
                        notationObject.threat = 'check';
                        stringIndex++;
                    }
                    const annotation = notation.substring(stringIndex + 1, notation.length);
                    const annotationList = {'!': 'a good move', '!!': 'a brilliant move', '!?': 'an interesting move', '?!': 'a dubious move', '??': 'a blunder', '?': 'a mistake'};
                    if (Object.keys(annotationList).includes(annotation)) notationObject.move = annotationList[annotation]
                    else if (annotation) {
                        notationObject.error = 'suffix';
                        break;
                    }
                    stringIndex = i - 2;
                    if (notation[stringIndex] == 'x') {
                        notationObject.capture = true;
                        stringIndex -= 1;
                    }
                    if (notation[stringIndex]?.charCodeAt(0) >= 49 && notation[stringIndex].charCodeAt(0) <= 56) {
                        notationObject.extraY = parseFloat(notation[i])-1;
                        stringIndex -= 1;
                    }
                    if (notation[stringIndex]?.charCodeAt(0) >= 97 && notation[stringIndex].charCodeAt(0) <= 104) {
                        notationObject.extraX = notation[i-1].charCodeAt(0)-97;
                        stringIndex -= 1;
                    }
                    if (pieceNotation.includes(notation[stringIndex])) notationObject.piece = notation[stringIndex];
                    if (notation.substring(0, stringIndex - 1)) notationObject.error = 'prefix';
                    break;
                }
            }
        }
        if (!notationObject.piece) notationObject.piece = 'P';
        if (notationObject.error == 'suffix') return  errorMessage.push(await chessErrors ('Trailing Annotation', 'Your move had extra trailing notation marks that were not accepted, you might be confused with: #, +, =R, =N, =B, =Q, !, !!, !?, ?!, ??, ?', msgReceived, startPlayers[playerTurn].mention));
        if (notationObject.error == 'prefix') return  errorMessage.push(await chessErrors ('Leading Annotation', 'Your move had extra leading notation marks that were not accepted.', msgReceived, startPlayers[playerTurn].mention));
        if (notationObject.piece[0] != '0' && (isNaN(notationObject.x) || isNaN(notationObject.y))) {
            let missingArray = [];
            if (!notationObject.x) missingArray.push ('X Coordinate')
            if (!notationObject.y) missingArray.push ('Y Coordinate')
            return  errorMessage.push(await chessErrors ('Missing Values', 'Your notation did not include the following information: ' + missingArray.join(', '), msgReceived, startPlayers[playerTurn].mention));
        }
        else if (notationObject.piece[0] != '0' && chessBoard[notationObject.y][notationObject.x].charCodeAt(0) > turnOffset + 97 && chessBoard[notationObject.y][notationObject.x].charCodeAt(0) <= turnOffset + 122) return errorMessage.push(await chessErrors ('Stalling or Overlap', 'The destination square is already occupied by another of your pieces', msgReceived, startPlayers[playerTurn].mention));
        let originArray = [];
        switch (notationObject.piece[0]) {
            case 'R': {
                for (let index = 0; index < 4; index++) {
                    const directionY = Math.round(Math.sin(index*Math.PI/2))
                    const directionX = Math.round(Math.cos(index*Math.PI/2))
                    for (let i = 1; i < 8; i++) {
                        const holdingPiece = chessBoard[directionY*i + notationObject.y]?.[directionX*i + notationObject.x];
                        if (!holdingPiece) break;
                        else if (holdingPiece.toUpperCase() == 'A');
                        else if (holdingPiece.charCodeAt(0) == turnOffset+101) originArray.push (directionX*i + notationObject.x, directionY*i + notationObject.y)
                        else break;
                    }
                }
                break;
            }
            case 'N': {
                const fromYArray = [-2,-1,-2,-1,2,1,2,1];
                const fromXArray = [-1,-2,1,2,-1,-2,1,2];
                for (let i = 0; i < 8; i++) {
                    let holdingPiece = chessBoard[fromYArray[i] + notationObject.y]?.[fromXArray[i] + notationObject.x];
                    if (holdingPiece && holdingPiece.charCodeAt(0) == turnOffset + 99) originArray.push (fromXArray[i] + notationObject.x, fromYArray[i] + notationObject.y);
                }
                break;
            }
            case 'B': {
                for (let index = 0; index < 4; index++) {
                    const directionY = Math.round(Math.sin(index*Math.PI/2+Math.PI/4));
                    const directionX = Math.round(Math.cos(index*Math.PI/2+Math.PI/4));
                    for (let i = 1; i < 8; i++) {
                        const holdingPiece = chessBoard[directionY*i + notationObject.y]?.[directionX*i + notationObject.x];
                        if (!holdingPiece) break;
                        else if (holdingPiece.toUpperCase() == 'A');
                        else if (holdingPiece.charCodeAt(0) == turnOffset+100) originArray.push (directionX*i + notationObject.x, directionY*i + notationObject.y);
                        else break;
                    }
                }
                break;
            }
            case 'Q': {
                for (let index = 0; index < 8; index++) {
                    const directionY = Math.round(Math.sin(index*Math.PI/4));
                    const directionX = Math.round(Math.cos(index*Math.PI/4));
                    for (let i = 1; i < 8; i++) {
                        const holdingPiece = chessBoard[directionY*i + notationObject.y]?.[directionX*i + notationObject.x];
                        if (!holdingPiece) break;
                        else if (holdingPiece.toUpperCase() == 'A');
                        else if (holdingPiece.charCodeAt(0) == turnOffset+102) originArray.push (directionX*i + notationObject.x, directionY*i + notationObject.y);
                        else break;
                    }
                }
                break;
            }
            case 'K': {
                for (let i = 0; i < 8; i++) {
                    const fromY = Math.round(Math.sin(i*Math.PI/4)) + notationObject.y;
                    const fromX = Math.round(Math.cos(i*Math.PI/4)) + notationObject.x;
                    const holdingPiece = chessBoard[fromY]?.[fromX];
                    if (holdingPiece?.charCodeAt(0) == turnOffset+103) originArray.push (fromX, fromY)
                }
                break;
            }
            case '0': {
                const yOffset = playerTurn * 7;
                let checkStart, checkEnd, attackChange;
                if (chessBoard[yOffset][4].charCodeAt(0) != turnOffset + 103) break;
                if (notationObject.piece == '0K') {
                    if (chessBoard[yOffset][7].charCodeAt(0) == turnOffset + 101) originArray = '0K';
                    checkStart = 5; checkEnd = 6; attackChange = 1;
                }
                else if (notationObject.piece == '0Q') {
                    if (chessBoard[yOffset][0].charCodeAt(0) == turnOffset + 101) originArray = '0Q';
                    checkStart = 1; checkEnd = 3; attackChange -1;
                }
                for (let i = checkStart; i < checkEnd + 1; i++) {
                    if (chessBoard[yOffset][i].toUpperCase() != 'A') originArray = [];
                }
                let attackStart = 4;
                for (let i = 0; i < 3; i++) {
                    if (!chessAttacked (chessBoard, {x: attackStart, y: yOffset}, -playerTurn + 1)) originArray = '0Check';
                    attackStart += attackChange;
                }
                if (originArray == '0Check') return errorMessage.push (await chessErrors ('Threatened King', 'You are not allowed to castle with the following conditions: The king is not in check, the king will not pass through check, and the king will not end in check.', msgReceived, startPlayers[playerTurn].mention));
                break;
            }
            case 'P': {
                if (chessBoard[notationObject.y + playerTurn * 2 - 1][notationObject.x].toUpperCase() == 'I' || chessBoard[notationObject.y][notationObject.x].toUpperCase() != 'A') {
                    for (let i = -1; i < 2; i += 2) {
                        if (chessBoard[playerTurn * 2 - 1 + notationObject.y]?.[notationObject.x + i]?.charCodeAt(0) == turnOffset + 98) {
                            originArray.push (notationObject.x + i, playerTurn * 2 - 1 + notationObject.y);
                            if (chessBoard[notationObject.y + playerTurn * 2 - 1][notationObject.x].toUpperCase() == 'I') notationObject.enPassant = true;
                        }
                    }
                }
                else {
                    if (notationObject.y == playerTurn * -7 + 7 && !notationObject.promote) return errorMessage.push(await chessErrors ('Promotion Not Specified', 'Pawns that reach the opposite rank must be promoted.', msgReceived, startPlayers[playerTurn].mention));
                    else if (chessBoard[notationObject.y][notationObject.x].toUpperCase() != 'A');
                    else if (chessBoard[playerTurn * 2 - 1 + notationObject.y][notationObject.x].charCodeAt(0) == turnOffset + 98) originArray.push (notationObject.x, playerTurn * 2 - 1 + notationObject.y);
                    else if (chessBoard[playerTurn * 2 - 1 + notationObject.y][notationObject.x].toUpperCase() == 'A' && playerTurn + 3 == notationObject.y && chessBoard[playerTurn * 4 - 2 + notationObject.y][notationObject.x].charCodeAt(0) == turnOffset + 98) {
                        originArray.push (notationObject.x, playerTurn * 4 - 2 + notationObject.y);
                        notationObject.jump = true;
                    }
                }
                break;
            }
        }
        if (originArray.length > 2) {
            for (let i = 0; i < originArray.length; i += 2) {
                if (notationObject.extraX && originArray[i] != notationObject.extraX) originArray = originArray.splice(i,2)
                else if (notationObject.extraX && originArray[i+1] != notationObject.extraY) originArray = originArray.splice(i,2)
            }
            if (originArray.length > 2) return errorMessage.push(await chessErrors ('Rank or File Not Specified', 'There are multiple pieces that could travel to that location, specify what rank, file, or both you are trying to travel to.', msgReceived, startPlayers[playerTurn].mention));
        }
        if (originArray.length == 0) return errorMessage.push (await chessErrors ('No Qualified Pieces', 'There are no pieces of the specified piece type that can reach the destination location.', msgReceived, startPlayers[playerTurn].mention));
        if (originArray[0] === '0') {
            const yOffset = playerTurn * 7;
            const pattern = 'AaAaAa';
            if (originArray == '0Q') chessBoard[yOffset] = chessBoard[yOffset].slice (0, 3) + pattern.substring(playerTurn+1, playerTurn+2) + String.fromCharCode(turnOffset+101) + String.fromCharCode(turnOffset+103) + pattern.substring(playerTurn, playerTurn+2)
            else if (originArray == '0K') chessBoard[yOffset] = pattern.substring(playerTurn, playerTurn+1) + String.fromCharCode(turnOffset+103) + String.fromCharCode(turnOffset+101) + pattern.substring(playerTurn+1, playerTurn+3) + chessBoard[yOffset].slice (5, 8)
        }
        else {
            const xFrom = originArray[0];
            const yFrom = originArray[1];
            let piecesReplace;
            if (notationObject.piece != 'P') piecesReplace = chessBoard[yFrom][xFrom];
            else if (notationObject.promote) {
                if (notationObject.promote == 'Q') piecesReplace = String.fromCharCode(102 + turnOffset);
                else if (notationObject.promote == 'N') piecesReplace = String.fromCharCode(99 + turnOffset);
                else if (notationObject.promote == 'R') piecesReplace = String.fromCharCode(101 + turnOffset);
                else if (notationObject.promote == 'B') piecesReplace = String.fromCharCode(100 + turnOffset);
            }
            else if (notationObject.jump) piecesReplace = String.fromCharCode(chessBoard[yFrom][xFrom].charCodeAt(0) + 8);
            else piecesReplace = chessBoard[yFrom][xFrom]
            chessBoard[notationObject.y] = (notationObject.x == 0 ? '' : chessBoard[notationObject.y].slice (0, notationObject.x)) + piecesReplace + chessBoard[notationObject.y].slice (notationObject.x + 1, 8);
            chessBoard[yFrom] = (xFrom == 0 ? '' : chessBoard[yFrom].slice(0, xFrom)) + ((xFrom + yFrom) % 2 == 0 ? 'A' : 'a') + chessBoard[yFrom].slice(xFrom + 1, 8);
            if (notationObject.enPassant) chessBoard[yFrom] = (xFrom == 0 ? '' : chessBoard[yFrom].slice(0, notationObject.x)) + ((notationObject.x + yFrom) % 2 == 0 ? 'A' : 'a') + chessBoard[yFrom].slice(notationObject.x + 1, 8)
        }
        let defendKing, attackKing;
        let defendObjective = (playerTurn && gameOption.extra.kingBlack) || (!playerTurn && gameOption.extra.kingWhite);
        let attackObjective = (playerTurn && gameOption.extra.kingWhite) || (!playerTurn && gameOption.extra.kingBlack);
        for (let i = 0; i < 8; i++) {
            const defendKingX = chessBoard[i].indexOf(playerTurn == 0 ? 'g' : 'G');
            if (defendKingX != -1) defendKing = {x: defendKingX, y: i};
            const attackKingX = chessBoard[i].indexOf(playerTurn == 0 ? 'G' : 'g');
            if (attackKingX != -1) attackKing = {x: attackKingX, y: i};
        }
        if (typeof defendKing != 'object' && defendObjective) return chessWin(startMessage.channel, 'King Missing', chessBoard, startPlayers, -playerTurn + 1, gameOption);
        if (typeof attackKing != 'object' && attackObjective) return chessWin(startMessage.channel, 'King Captured', chessBoard, startPlayers, playerTurn, gameOption);
        let defendingPosition = chessAttacked(chessBoard, defendKing, -playerTurn + 1);
        let attackingPosition = chessAttacked(chessBoard, attackKing, playerTurn);
        if (defendingPosition?.length && defendObjective) return errorMessage.push (await chessErrors ('Threatened King', 'You are not allowed to put your own king in a check or a chessmate, either by moving a protecting piece or moving the king directly.', msgReceived, startPlayers[playerTurn].mention));
        let movement = false;
        let safe = true;
        if (attackingPosition?.length && attackObjective) safe = false;
        capture: { 
            if (attackingPosition?.length > 1 || safe) break capture;
            let defendPosition = chessAttacked(chessBoard, attackingPosition, -playerTurn + 1);
            if (!defendPosition.length) break capture;
            for (let i = 0; i < defendPosition.length; i++) {
                if (defendPosition[i].piece == 'N') {safe = movement = true; break};
                let direction = {x: Math.sign(defendPosition[i].x-attackKing.x), y: Math.sign(defendPosition[i].y-attackKing.y)};
                let pieceOffset = Math.abs(direction.x-direction.y) == 1 ? 101 : 100;
                for (let i = 0; i < 6; i++) {
                    let holdingPiece = chessBoard[direction.x*i+defendPosition[i].x][direction.y*i+defendPosition[i].y];
                    if (!holdingPiece) {safe = movement = true; break capture}
                    else if (holdingPiece.toUpperCase() == 'A');
                    else if (holdingCode == turnOffset+102 || holdingPiece == turnOffset+pieceOffset) break;
                    else {safe = movement = true; break capture};
                }
            }
        }
        blocking: {
            if (attackingPosition?.length > 1 || safe || !attackPosition[0] || attackingPosition[0].piece == 'P' || attackingPosition[0].piece == 'N' || attackingPosition[0].piece == 'K') break blocking;
            if (attackingPosition[0].piece == 'P' || attackingPosition[0].piece == 'N' || attackingPosition[0].piece == 'K') break blocking
            let kingDirection = {x: Math.sign(attackingPosition[0].x-attackKing.x), y: Math.sign(attackingPosition[0].y-attackKing.y)}
            for (let index = 0; index < 6; index++) {
                let defendPosition = chessAttacked(chessBoard, {x: kingDirection.x*index+attackKing.x, y: kingDirection.y*index+attackKing.y}, playerTurn);
                for (let ind = 0; ind < defendPosition.length; ind++) {
                    let defensiveDirection = {x: Math.sign(defendPosition[ind].x-attackKing.x), y: Math.sign(defendPosition[ind].y-attackKing.y)}
                    let pieceOffset = Math.abs(defensiveDirection.x-defensiveDirection.y) == 1 ? 101 : 100;
                    for (let i = 0; i < 6; i++) {
                        let holdingPiece = chessBoard[defensiveDirection.x*i+defendPosition[ind].x]?.[defensiveDirection.y*i+defendPosition[ind].y];
                        let holdingCode = holdingPiece?.charCodeAt(0);
                        if (!holdingPiece) {safe = movement = true; break blocking}
                        else if (holdingPiece.toUpperCase() == 'A');
                        else if (holdingCode == turnOffset+102 || holdingPiece == turnOffset+pieceOffset) break;
                        else {safe = movement = true; break blocking}
                    }
                }
            }
        }
        escaping: {
            if ((safe && movement) || !attackKing) break escaping;
            for (let i = 0; i < 8; i++) {
                const fromX = Math.round(Math.cos(i*Math.PI/4)) + attackKing.x;
                const fromY = Math.round(Math.sin(i*Math.PI/4)) + attackKing.y;
                if (chessBoard[fromY]?.[fromX]?.toUpperCase() == 'A') {
                    let escapePosition = chessAttacked (chessBoard, {x: fromX, y: fromY}, playerTurn)
                    if (!escapePosition.length) {safe = movement = true; break escaping}
                }
            }
        }
        moving: {
            if (movement) break moving;
            for (let index = 0; index < 64; index++) {
                const y = index % 8;
                const x = (index - y) / 8;
                const holdingPiece = chessBoard[y][x];
                const holdingCode = holdingPiece.charCodeAt(0)
                if (holdingPiece.toUpperCase() == 'A' || holdingPiece.toUpperCase() == 'G');
                else if ((holdingCode >= 91 && playerTurn == 0) || (holdingCode < 91 && playerTurn == 1));
                else {
                    let pieceMove = false;
                    switch (holdingCode - playerTurn * 32 - 65) {
                        case 1: {
                            if (chessBoard[playerTurn * 2 - 1 + y][x].toUpperCase() == 'A') {pieceMove = true; break}
                            else if (chessBoard[playerTurn * 4 - 2 + y]?.[x]?.toUpperCase() == 'A') {pieceMove = true; break}
                            else for (let i = -1; i < 2; i += 2) {
                                let character = chessBoard[playerTurn * 2 - 1 + notationObject.y]?.[notationObject.x + i];
                                if (character?.toUpperCase() == 'A');
                                else if ((character?.charCodeAt(0) >= 91 && playerTurn == 1) || (character?.charCodeAt(0) < 91 && playerTurn == 0)) {pieceMove = true; break}
                            }
                            break;
                        }
                        case 2: {
                            for (let i = 0; i < 4; i++) {
                                const yTo = Math.round(Math.sin(index*Math.PI/2)) + y;
                                const xTo = Math.round(Math.cos(index*Math.PI/2)) + x;
                                let character = chessBoard?.[yTo]?.[xTo];
                                if ((character?.charCodeAt(0) >= 91 && playerTurn == 1) || (character?.charCodeAt(0) < 91 && playerTurn == 0)) {pieceMove = true; break}
                            }
                            break;
                        }
                        case 3: {
                            const fromYArray = [-2,-1,-2,-1,2,1,2,1];
                            const fromXArray = [-1,-2,1,2,-1,-2,1,2];
                            for (let i = 0; i < 8; i++) {
                                let character = chessBoard[fromYArray[i] + y]?.[fromXArray[i] + x];
                                if ((character?.charCodeAt(0) >= 91 && playerTurn == 1) || (character?.charCodeAt(0) < 91 && playerTurn == 0)) {pieceMove = true; break}
                            }                        
                            break;
                        }
                        case 4: {
                            for (let i = 0; i < 4; i++) {
                                const yTo = Math.round(Math.sin(index*Math.PI/2+Math.PI/4)) + y;
                                const xTo = Math.round(Math.cos(index*Math.PI/2+Math.PI/4)) + x;
                                let character = chessBoard?.[yTo]?.[xTo]
                                if ((character?.charCodeAt(0) >= 91 && playerTurn == 1) || (character?.charCodeAt(0) < 91 && playerTurn == 0)) {pieceMove = true; break}
                            }
                            break;
                        }
                        case 5: {
                            for (let i = 0; i < 8; i++) {
                                const yTo = Math.round(Math.sin(index*Math.PI/4)) + y;
                                const xTo = Math.round(Math.cos(index*Math.PI/4)) + x;
                                let character = chessBoard?.[yTo]?.[xTo]
                                if ((character?.charCodeAt(0) >= 91 && playerTurn == 1) || (character?.charCodeAt(0) < 91 && playerTurn == 0)) {pieceMove = true; break}
                            }
                            break;
                        }
                    }
                    if (pieceMove) {
                        let duplicateBoard = (x == 0 ? '' : chessBoard[y].slice(0, x)) + ((x + y) % 2 == 0 ? 'A' : 'a') + chessBoard[y].slice(x + 1, 8);
                        if (!chessAttacked (duplicateBoard, attackKing, playerTurn)?.length || attackObjective) {movement = true; break moving};
                    }
                }
            }
        }
        if (!safe) return chessWin(startMessage.channel, 'King Checkmated', chessBoard, startPlayers, playerTurn, gameOption);
        if (!movement && !attackObjective) return chessWin(startMessage.channel, 'King Stalemated', chessBoard, startPlayers, {action: 's', turn: playerTurn}, gameOption)
        if (!notationObject.move) notationObject.move = 'used'
        let embedGame = {
            title: 'Fun - Chess',
            color: randomColor ('white'),
            timestamp: new Date().toISOString(),
            description: 'The notation `' + notation + '` was ' + notationObject.move + ' by ' + startPlayers[playerTurn].mention + '.',
            fields: [
                {name: 'How to Move:', value: 'Use algebraic notation to interact with the chess board. Type `move <notation>` to move. It\'s ' + (playerTurn == 0 ? 'white' : 'black') + '\'s turn to move.', inline: false},
                {name: 'Chess Board:', value: lettersToChess(chessBoard, playerTurn, gameOption), inline: false},
            ]
        }
        startMessage.edit ({content: startPlayers[playerTurn * -1 + 1].mention + ',', embed: embedGame});
        for (let i = 0; i < 8; i++) chessBoard[i] = chessBoard[i].replace(String.fromCharCode(72 + playerTurn * 32), String.fromCharCode(66 + playerTurn * 32));
        for (let i = 0; i < errorMessage.length; i++) errorMessage[i].delete();
        msgReceived.delete();
        chessRound (startMessage, startPlayers, chessBoard, playerTurn, gameOption);
        collector.stop ('stopped');
    })
    collector.on ('end', (collected, reason) => {
        if (reason == 'stopped') return;
        chessWin(startMessage.channel, 'Time Constraint Reached', backupBoard, startPlayers, playerTurn * -1 + 1, gameOption);
        for (let i = 0; i < errorMessage.length; i++) {
            if (errorMessage[i].id) errorMessage[i].delete();
        }
    })
}

async function chessErrors (reasonName, reasonValue, sendMessage, sendMention) {
    sendMessage.delete();
    let embed = {
        title: 'Error - Chess',
        description: 'The notation used, `' + (sendMessage.content.toLowerCase().startsWith('move') ? sendMessage.content.substring(5) : sendMessage.content.substring(6)) +  '`, resulted in an error. Consult with an official chess notation website to learn the correct notation.',
        color: randomColor ('orange'),
        timestamp: new Date().toISOString(),
        fields: [
            {name: reasonName, value: reasonValue, inline: false}
        ]
    }
    return await sendMessage.channel.createMessage ({content: sendMention + ',', embed: embed});
}

async function chessWin (channel, winCondition, chessBoard, startPlayers, winner, gameOption) {
    let playerMentions = startPlayers[0].mention + ' ' + startPlayers[1].mention;
    let embedEnd = {
        title: 'Fun - Chess',
        color: randomColor ('orange'),
        timestamp: new Date().toISOString(),
        description: 'The game has ended due to a win condition being met: ' + winCondition,
        fields: [
            {name: 'Win Condition:', value: winCondition, inline: true},
            (winner.action == 's' ? {name: 'Stalemating:', value: startPlayers[winner.turn].mention, inline: true} : {name: 'Winner:', value: startPlayers[winner].mention, inline: true}),
            (winner.action == 's' ? {name: 'Stalemated:', value: startPlayers[-winner.turn + 1].mention, inline: true} : {name: 'Loser:', value: startPlayers[winner * -1 + 1].mention, inline: true}),
            {name: 'Final Chess Board:', value: lettersToChess(chessBoard, 0, gameOption), inline: false},
            {name: 'Rematch:', value: 'React to this message to earn the chance to play chess.' + (gameOption.wager > 0 ? '\n**ATTENTION:** This game is a wager match, it will cost $' + gameOption.wager + ' to enter.' : ''), inline: false}
        ]
    }
    let message = await channel.createMessage ({content: playerMentions + ',', embed: embedEnd});
    if (gameOption.wager > 0 && winner.action == 's') {
        for (let i = 0; i < 2; i++) {
            let userInfo = await getUserInfo(startPlayers[i].id, startMessage.channel.guild.id);
            userInfo.money = userInfo.money + gameOption.wager
            userInfo.save();
        }
    }
    else if (gameOption.wager > 0 ) {
        let winnerInfo = await getUserInfo(startPlayers[winner].id, startMessage.channel.guild.id);
        winnerInfo.money = winnerInfo.money + gameOption.wager * 2;
        winnerInfo.save();
    }
    gameLobby (message, embedEnd, 'Chess', playerMentions, 2, 2, chessStarter, gameOption);
}

function lettersToChess (board, turn, gameOption) {
    let style, number, letter, corner;
    switch (gameOption.style) {
        case 'Normal': style = ['◻️','◼️','🧑🏻‍🌾','🧑🏿‍🌾','🧑🏻‍✈️','🧑🏿‍✈️','🧙🏻','🧙🏿','👮🏻','👮🏿','🦸🏻','🦸🏿','🤵🏻','🤵🏿']; break;
        case 'Gender': style = ['🟦','🟪','👨‍🌾','👩‍🌾','👨‍✈️','👩‍✈️','🧙‍♂️','🧙‍♀️','🦸‍♂️','🦸‍♀️','👮‍♂️','👮‍♀️','🤵‍♂️','🤵‍♀️']; break;
        case 'Plants': style = ['🟩','🟫','🪴','🌿','🌾','🌳','🍄','🪵','🌹','🌴','🌾','🌳','🌼','🌲','🌻','🎄']; break;
        case 'Humans Versus Animals': style = ['◻️','◼️','🧑‍🌾','🐧','🥷','🦜','🕵️','🐅','👮','🦬','🦸','🦖','🤵','🦚']; break;
        case 'Buildings': style = ['🌫️','⬛','⛺','🏠','🛖','🏪','🛕','🏥','⛪','🏭','🏯','🏟️','🏰','🏛️']; break;
        case 'Unicode': {
            style = [' □ ​',' ■ ​',' ♙ ​',' ♟︎ ​',' ♘ ​',' ♞ ​',' ♗ ​',' ♝ ​',' ♖ ​',' ♜ ​',' ♕ ​',' ♛ ​',' ♔ ​',' ♚ ​']; 
            number = ['​ 1 ​',' 2 ​',' 3 ​',' 4 ​',' 5 ​',' 6 ​',' 7 ​','​ 8 ​',];
            letter = [' A ​',' B ​',' C ​',' D ​',' E ​',' F ​',' G ​',' H ​'];
            corner = '​ ╚ ​'
            break;
        }
        case 'Letter': {
            style = ['`  `​','`##`​','`WP`​','`BP`​','`WN`​','`BN`​','`WB`​','`BB`​','`WR`​','`BR`​','`WQ`​','`BQ`​','`WK`​','`BK`​'];
            number = ['`1.`​','`2.`​','`3.`​','`4.`​','`5.`​','`6.`​','`7.`​','`8.`​'];
            letter = ['`A.`​','`B.`​','`C.`​','`D.`​','`E.`​','`F.`​','`G.`​','`H.`​'];
            corner = '`[]`​';
            break;
        }
        case 'Color Blind': style = ['◻️','◻️','🧑‍🌾','🧑‍🌾','🧑‍✈️','🧑‍✈️','🧙','🧙','👮','👮','🦸','🦸','🤵','🤵']; break;
        case 'Piece Blind': style = ['◼️','◻️','👮🏻','👮🏿','👮🏻','👮🏿','👮🏻','👮🏿','👮🏻','👮🏿','👮🏻','👮🏿','👮🏻','👮🏿']; break;
        case 'Board Blind': style = ['🌫️','🌫️','🌫️','🌫️','🌫️','🌫️','🌫️','🌫️','🌫️','🌫️','🌫️','🌫️','🌫️','🌫️']; break;
    }
    if (!number) number = config.discordInfo.emoji.numbers.slice(1,9);
    if (!letter) letter = config.discordInfo.emoji.letters.slice(0, 8);
    if (!corner) corner = ':record_button:';
    let newBoard = [...board];
    if (turn == 0) for (let i = 0; i < 8; i++) newBoard[i] = newBoard[i].split('').reverse().join('');
    for (let i = 0; i < 8; i++) newBoard[i] = String.fromCharCode(i+49) + newBoard[i];
    if (turn == 1) newBoard = newBoard.reverse();
    for (let i = 0; i < 6; i++) newBoard[i+1] = newBoard[i+1] + String.fromCharCode(i+59);
    newBoard = newBoard.join ('\n');
    const replaceFrom = 'aAbBcCdDeEfFgGhHiIjJ12345678';
    const replaceTo = [...style, ...style.slice(0,6), ...number];
    const replaceWhat = ['The Pawn', 'The Knight', 'The Bishop', 'The Rook', 'The Queen', 'The King']
    for (let i = 0; i < replaceFrom.length; i++) {
        let regexV = new RegExp(replaceFrom[i], 'g');
    	newBoard = newBoard.replace(regexV, replaceTo[i]);
    }
    for (let i = 0; i < 6; i++) newBoard = newBoard.replace(String.fromCharCode(i+59), ' ｜ ' + style[turn+i*2+2] + style[-turn+1+i*2+2] + ' — ' + replaceWhat[i])
    if (turn == 0) letter = letter.reverse();
    newBoard = newBoard + '\n' + corner + letter.join('');
    return newBoard;
}

function chessAttacked (chessBoard, coordinate, attacker) {
    if (!coordinate) return;
    if (!coordinate.piece) coordinate.piece = null;
    let attacked = [];
    const turnOffset = attacker * -32;
    const fromYArray = [-2,-1,-2,-1,2,1,2,1];
    const fromXArray = [-1,-2,1,2,-1,-2,1,2];
    for (let i = 0; i < 8; i++) {
        let holdingPiece = chessBoard[fromYArray[i] + coordinate.y]?.[fromXArray[i] + coordinate.x];
        if (holdingPiece && holdingPiece.charCodeAt(0) == turnOffset + 99) attacked.push ({x: fromXArray[i] + coordinate.x, y: fromYArray[i] + coordinate.y, piece: 'N'});
    }
    for (let index = 0; index < 8; index++) {
        const directionY = Math.round(Math.sin(index*Math.PI/4))
        const directionX = Math.round(Math.cos(index*Math.PI/4))
        for (let i = 1; i < 8; i++) {
            const holdingPiece = chessBoard[directionY*i + coordinate.y]?.[directionX*i + coordinate.x];
            if (!holdingPiece) break;
            const holdingCode = holdingPiece.charCodeAt(0);
            let pieceType;
            if (holdingPiece.toUpperCase() != 'A') {
                if (i == 0 && holdingCode == turnOffset+103) pieceType = 'K';
                else if (holdingCode == turnOffset+102) pieceType = 'Q';
                else if (index%2 == 1 && holdingCode == turnOffset+100) pieceType = 'B';
                else if (index%2 == 0 && holdingCode == turnOffset+101) pieceType = 'R';
                if (pieceType) attacked.push ({x: directionX*i + coordinate.x, y: directionY*i + coordinate.y, piece: pieceType});
                break;
            }
        }
    }
    for (let i = -1; i < 2; i += 2) {
        if (chessBoard[attacker * -2 + 1 + coordinate.y]?.[coordinate.x + i]?.charCodeAt(0) == turnOffset + 98) {
            attacked.push ({x: coordinate.x + i, y: attacker * -2 + 1 + coordinate.y, piece: 'P'});
        }
    }
    return attacked;
}

async function chessSelect (message, chessBoard, time, startPlayers, gameOption) {
    if (time >= 17) {
        gameOption.extra.board = chessBoard
        return chessStarter (message, startPlayers, gameOption)
    }
    const turn = time % 2;
    const y = turn * -7 + 7;
    let errorMessage = [];
    const pieceNotation = ['R','N','B','Q','K'];
    const pieceNames = ['Rook','Night','Bishop','Queen','King'];
    const pieceReplace = ['c','d','e','f','g'];
    let filter = (msg) => msg.content.toLowerCase().startsWith('place ') && msg.author.id == startPlayers[turn].id && msg.content.length < 20;
    const collector = new messageCollector (client, message.channel, filter, {time: 120000});
    collector.on ('collect', async (msgReceived) => {
        let piecePlace = msgReceived.content[6];
        const x = msgReceived.content[7]?.charCodeAt(0)-97;
        if (!pieceNotation.includes(piecePlace) || isNaN(x) || x < 0 || x > 7) {
            let missingArray = [];
            if (!pieceNotation.includes(piecePlace)) missingArray.push ('Pieces')
            if (!x || x < 0 || x > 7) missingArray.push ('X Coordinate')
            return errorMessage.push(await chessErrors('Missing Values', 'Your notation did not include the following information: ' + missingArray.join(', '), msgReceived, startPlayers[turn].mention));
        }
        else if (chessBoard[y][x].toUpperCase() != 'H') return errorMessage.push(await chessErrors('Overlap', 'The destination square is already occupied by another of your pieces', msgReceived, startPlayers[turn].mention));
        else if (msgReceived.content.length > 8) return errorMessage.push(await chessErrors('Suffix', 'The notation includes extra letters not included in pre-chess mode.', msgReceived, startPlayers[turn].mention));
        else if (!gameOption.extra.placePieces[turn].includes(piecePlace)) return errorMessage.push(await chessErrors('Piece Unavailable', 'You have no ' + pieceNames[pieceNotation.findIndex(ele => ele == piecePlace)].toLowerCase() + 's left to place. However, you can place any of the following: ' + gameOption.extra.placePieces[turn] + '.', msgReceived, startPlayers[turn].mention));
        const pieceIndex = pieceNotation.findIndex(ele => ele == piecePlace)
        let piece = pieceReplace[pieceIndex];
        if (turn == 0) piece = piece.toUpperCase();
        chessBoard[y] = (x == 0 ? '' : chessBoard[y].slice (0, x)) + piece + chessBoard[y].slice(x + 1, 8);
        const extraIndex = gameOption.extra.placePieces[turn].indexOf(piecePlace);
        gameOption.extra.placePieces[turn] = (extraIndex == 0 ? '' : gameOption.extra.placePieces[turn].slice (0, extraIndex)) + gameOption.extra.placePieces[turn].slice(extraIndex + 1, 8);
        for (let i = 0; i < errorMessage.length; i++) errorMessage[i].delete();
        msgReceived.delete();
        let embedGame = {
            title: 'Fun - Chess',
            color: randomColor ('white'),
            timestamp: new Date().toISOString(),
            fields: [
                {name: 'What to Do:', value: 'In the pre-chess variant both players take turns placing their pieces behind pawns before fighting. Use `place <piece><x>` (like: `place Qa`) to place a piece.', inline: false},
                {name: 'Chess Board:', value: lettersToChess(chessBoard, -turn + 1, gameOption), inline: false},
            ]
        }
        message = await message.edit ({content: startPlayers[-turn + 1].mention + ',', embed: embedGame});
        time = time + 1
        chessSelect (message, chessBoard, time, startPlayers, gameOption)
        collector.stop ('stopped')
    })
    collector.on ('end', (collected, reason) => {
        if (reason == 'stopped') return;
        chessWin(message.channel, 'Time Constraint Reached', chessBoard, startPlayers, turn * -1 + 1, gameOption);
        for (let i = 0; i < errorMessage.length; i++) if (errorMessage[i].id) errorMessage[i].delete();
    })
}

async function chessImage (chessBoard, reverse) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(300, 400, 600, -100);
    grd.addColorStop(0, '#a6a6a6');
    grd.addColorStop(1, '#808080');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.font = 'bold 20px Verdana';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e68a2e';
    ctx.fillRect (28, 0, 272, 272);
    ctx.fillStyle = '#cc7014';
    for (let i = 0; i < 64; i++) {
        const y = i % 8;
        const x = Math.floor(i / 8)
        if ((y + x) % 2 == -reverse + 1) ctx.fillRect (x*34 + 28, y*34, 34, 34);
    }
    ctx.fillStyle = '#000000';
    for (let i = 1; i < 9; i++) {
        const text = (reverse ? -i + 8 : i)
        ctx.fillText(text, 14, i * 34 - 17);
    }
    for (let i = 0; i < 8; i++) {
        const text = String.fromCharCode(65 + i)
        ctx.fillText(text, i * 34 + 47, 286);
    }
    ctx.lineWidth = 3;
    for (let i = 0; i < 64; i++) {
        const y = i % 8;
        const x = Math.floor(i / 8);
        const cy = y * 34;
        const cx = x * 34 + 28;
        const p = chessBoard[y][x];
        if (p.charCodeAt(0)>91) {ctx.fillStyle = '#292929'; ctx.strokeStyle = '#0a0a0a'}
        else {ctx.fillStyle = '#d6d6d6'; ctx.strokeStyle = '#383838'}
        ctx.beginPath();
        switch (p.toUpperCase()) { // 4 pixel buffer flat, 4 pixel buffer round, 3 pixel buffer line.
            case 'B': {
                ctx.moveTo(cx+6,cy+30);
                ctx.lineTo(cx+28,cy+30);
                ctx.quadraticCurveTo(cx+29,cy+22,cx+23,cy+20);
                ctx.quadraticCurveTo(cx+26,cy+16,cx+22,cy+9);
                ctx.arc(cx+17,cy+9,5,0,Math.PI,true);
                ctx.quadraticCurveTo(cx+8,cy+16,cx+11,cy+20);
                ctx.quadraticCurveTo(cx+5,cy+22,cx+6,cy+30);
                ctx.lineTo(cx+17,cy+30);
                ctx.fill();
                ctx.stroke();
                break;
            }
            case 'C': { // Night
                ctx.moveTo(cx+13,cy+30);
                ctx.lineTo(cx+29,cy+30);
                ctx.quadraticCurveTo(cx+28,cy+3,cx+13,cy+6);
                ctx.quadraticCurveTo(cx+8,cy+13,cx+6,cy+17);
                ctx.lineTo(cx+8,cy+18)
                ctx.quadraticCurveTo(cx+9,cy+19,cx+17,cy+19);
                ctx.quadraticCurveTo(cx+16,cy+27,cx+13,cy+30);
                ctx.lineTo(cx+13,cy+30);
                ctx.fill();
                ctx.stroke();
                break;
            }
            case 'D': {
                break;
            }
            case 'E': {
                break;
            }
            case 'F': {
                break;
            }
            case 'G': {
                break;
            }
        }
    }
    return messageImage;
}

/*
White space = a
Black space = A
White pawn = b
Black pawn = B
White rook = c
Black rook = C
White knight = d
Black knight = D
White bishop = e
Black bishop = E
White queen = f
Black queen = F
White king = g
Black king = G
White space Unused = h (pre-chess)
Black space Unused = H
White pawn passant = i
Black pawn passant = I
White rook unmoved = j
Black rook unmoved = J
*/